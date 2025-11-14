import { useMemo, useState } from 'react';
import { Download, RefreshCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';

import { useAuth } from '@/context/AuthContex';
import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PageMeta from '@/components/common/PageMeta';
import MyLeads from '@/components/sales/myleads/MyLeads';
import { STAGE_META, STAGE_SEQUENCE } from '@/components/sales/myleads/stageMeta';
import { LeadStage, LeadStageFilter } from '@/components/sales/myleads/interface/type';
import Button from '@/components/ui/button/Button';
import { LEADS_PAGED, MY_ASSIGNED_LEADS } from '@/core/graphql/lead/lead.gql';

type FilterId = 'ALL' | LeadStage | LeadStageFilter | 'PENDING_CALLS' | 'MISSED_CALLS';
type FilterMode = 'STAGE' | 'STATUS';

type StageCardInfo = {
  id: FilterId;
  label: string;
  helper?: string;
  count?: number;
  badgeClass?: string;
};

export default function LeadStagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MARKETING';

  const [selectedStage, setSelectedStage] = useState<FilterId>('ALL');
  const [mode, setMode] = useState<FilterMode>('STAGE');
  const [q, setQ] = useState('');
  const [exportOpen, setExportOpen] = useState(false);

  // ⬇️ IMPORTANT: args MUST match schema LeadListArgs
  const baseArgs = useMemo(
    () => ({
      page: 1,
      pageSize: 200,
      archived: false,
      // leave others undefined unless you really need them
    }),
    [],
  );

  // Live data: Admin/Marketing → all leads; RM → only assigned leads
  const { data, loading, error, refetch } = useQuery(
    isAdmin ? LEADS_PAGED : MY_ASSIGNED_LEADS,
    {
      variables: { args: baseArgs },
      fetchPolicy: 'cache-and-network',
    },
  );

  // Helper to safely get items array regardless of which query ran
  const items = useMemo(() => {
    if (!data) return [];
    if (isAdmin) {
      return (data as any)?.leads?.items ?? [];
    }
    return (data as any)?.myAssignedLeads?.items ?? [];
  }, [data, isAdmin]);

  // Map GQL -> MyLeads interface
  const allLeads = useMemo(() => {
    if (!items?.length) return [];

    return items.map((n: any) => {
      const createdAt = n.createdAt ?? null;
      const approachAt = n.approachAt ?? null;
      const baseTs = approachAt || createdAt;
      const agingDays =
        baseTs != null
          ? Math.max(0, Math.floor((Date.now() - Date.parse(baseTs)) / 86400000))
          : undefined;

      return {
        id: n.id,
        leadCode: n.leadCode ?? null,
        name: (n.name || [n.firstName, n.lastName].filter(Boolean).join(' ')) ?? '-',
        email: n.email ?? null,
        mobile: n.phone ?? null,
        location: n.location ?? undefined,
        agingDays,
        leadSource: n.leadSource ?? '-',
        // Status column should reflect only the Stage Filter (not pipeline stage)
        status: n.stageFilter ?? undefined,
        stageFilter: n.stageFilter ?? null,
        clientStage: n.clientStage || undefined,
        lastContactedAt: n.lastContactedAt ?? null,
        nextActionDueAt: n.nextActionDueAt ?? null,
        assignedRm: n.assignedRM ?? null,
        isNew: n.clientStage === 'NEW_LEAD' || !n.lastContactedAt,
      };
    });
  }, [items]);

  // Stage counts for “By stage” mode
  const stageCounts = useMemo(() => {
    const counts = new Map<LeadStage, number>();
    STAGE_SEQUENCE.forEach((stage) => counts.set(stage, 0));

    allLeads.forEach((lead: any) => {
      const st = lead.clientStage as LeadStage | undefined;
      if (st && counts.has(st)) {
        counts.set(st, (counts.get(st) ?? 0) + 1);
      }
    });
    return counts;
  }, [allLeads]);

  // Status display metadata — mirrors enums in schema
  const STATUS_SEQUENCE: LeadStageFilter[] = useMemo(
    () => [
      LeadStageFilter.FUTURE_INTERESTED,
      LeadStageFilter.HIGH_PRIORITY,
      LeadStageFilter.LOW_PRIORITY,
      LeadStageFilter.NEED_CLARIFICATION,
      LeadStageFilter.NOT_ELIGIBLE,
      LeadStageFilter.NOT_INTERESTED,
      LeadStageFilter.ON_PROCESS,
    ],
    [],
  );

  const STATUS_META: Record<LeadStageFilter, { label: string; pillClass: string }> = {
    [LeadStageFilter.FUTURE_INTERESTED]: {
      label: 'Future interested',
      pillClass:
        'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
    },
    [LeadStageFilter.HIGH_PRIORITY]: {
      label: 'High priority',
      pillClass:
        'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    },
    [LeadStageFilter.LOW_PRIORITY]: {
      label: 'Low priority',
      pillClass:
        'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-100',
    },
    [LeadStageFilter.NEED_CLARIFICATION]: {
      label: 'Need clarification',
      pillClass:
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200',
    },
    [LeadStageFilter.NOT_ELIGIBLE]: {
      label: 'Not eligible',
      pillClass:
        'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200',
    },
    [LeadStageFilter.NOT_INTERESTED]: {
      label: 'Not interested',
      pillClass:
        'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
    },
    [LeadStageFilter.ON_PROCESS]: {
      label: 'On process',
      pillClass:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
    },
  };

  // Cards at top (Stage or Status mode)
  const stageCards = useMemo<StageCardInfo[]>(() => {
    const now = Date.now();
    const soonCutoff = now + 24 * 60 * 60 * 1000; // 24h

    const pendingCalls = allLeads.filter((l: any) => {
      const ts = l.nextActionDueAt ? Date.parse(l.nextActionDueAt) : NaN;
      return Number.isFinite(ts) && ts >= now && ts <= soonCutoff;
    }).length;

    const missedCalls = allLeads.filter((l: any) => {
      const ts = l.nextActionDueAt ? Date.parse(l.nextActionDueAt) : NaN;
      return Number.isFinite(ts) && ts < now;
    }).length;

    if (mode === 'STATUS') {
      const statusCounts = new Map<LeadStageFilter, number>();
      STATUS_SEQUENCE.forEach((s) => statusCounts.set(s, 0));

      allLeads.forEach((l: any) => {
        const sf = l.stageFilter as LeadStageFilter | undefined;
        if (sf && statusCounts.has(sf)) {
          statusCounts.set(sf, (statusCounts.get(sf) ?? 0) + 1);
        }
      });

      return [
        {
          id: 'ALL',
          label: 'All statuses',
          helper: 'Overview',
          count: allLeads.length,
          badgeClass:
            'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200',
        },
        ...STATUS_SEQUENCE.map((sf) => ({
          id: sf,
          label: STATUS_META[sf].label,
          helper: undefined,
          count: statusCounts.get(sf) ?? 0,
          badgeClass: STATUS_META[sf].pillClass,
        })),
        {
          id: 'PENDING_CALLS',
          label: 'Pending calls',
          helper: undefined,
          count: pendingCalls,
          badgeClass:
            'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
        },
        {
          id: 'MISSED_CALLS',
          label: 'Missed calls',
          helper: undefined,
          count: missedCalls,
          badgeClass:
            'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
        },
      ];
    }

    // Stage mode (pipeline)
    return [
      {
        id: 'ALL',
        label: 'All stages',
        helper: 'Overview',
        count: allLeads.length,
        badgeClass:
          'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200',
      },
      ...STAGE_SEQUENCE.map((stage) => ({
        id: stage,
        label: STAGE_META[stage].label,
        helper: undefined,
        count: stageCounts.get(stage) ?? 0,
        badgeClass: STAGE_META[stage].pillClass,
      })),
      {
        id: 'PENDING_CALLS',
        label: 'Pending calls',
        helper: undefined,
        count: pendingCalls,
        badgeClass:
          'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
      },
      {
        id: 'MISSED_CALLS',
        label: 'Missed calls',
        helper: undefined,
        count: missedCalls,
        badgeClass:
          'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
      },
    ];
  }, [mode, stageCounts, allLeads, STATUS_SEQUENCE]);

  // Filter by selected card (stage/status/pending/missed)
  const filteredByStage = useMemo(() => {
    if (selectedStage === 'ALL') return allLeads;

    if (selectedStage === 'PENDING_CALLS' || selectedStage === 'MISSED_CALLS') {
      const now = Date.now();
      const soonCutoff = now + 24 * 60 * 60 * 1000;
      return allLeads.filter((l: any) => {
        const ts = l.nextActionDueAt ? Date.parse(l.nextActionDueAt) : NaN;
        if (!Number.isFinite(ts)) return false;
        if (selectedStage === 'MISSED_CALLS') return ts < now;
        return ts >= now && ts <= soonCutoff;
      });
    }

    if (mode === 'STATUS') {
      return allLeads.filter((lead: any) => lead.stageFilter === selectedStage);
    }

    return allLeads.filter((lead: any) => lead.clientStage === selectedStage);
  }, [selectedStage, allLeads, mode]);

  // Text search filter
  const filtered = useMemo(() => {
    const dataset = filteredByStage;
    if (!q.trim()) return dataset;

    const qq = q.toLowerCase();
    return dataset.filter((lead: any) =>
      [
        lead.name,
        lead.email ?? '',
        lead.leadCode ?? '',
        lead.mobile ?? '',
        lead.location ?? '',
        lead.leadSource ?? '',
        String(lead.agingDays ?? ''),
      ]
        .join(' ')
        .toLowerCase()
        .includes(qq),
    );
  }, [filteredByStage, q]);

  return (
    <>
      <PageMeta
        title="Lead stages"
        description="Track pipeline health by stage"
      />
      <PageBreadcrumb
        pageTitle="Lead Stages"
        items={[{ label: 'My Leads', href: '/sales/stages' }]}
      />

      {/* Mode toggle: Stage vs Status */}
      <div className="mb-3 flex items-center justify-end gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-white/60">
          View
        </span>
        <div className="inline-flex rounded-xl border border-gray-200 p-1 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode('STAGE');
              setSelectedStage('ALL');
            }}
            className={`rounded-lg px-3 py-1 text-xs font-semibold ${
              mode === 'STAGE'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                : 'text-gray-600 hover:bg-gray-50 dark:text-white/70 dark:hover:bg-white/[0.06]'
            }`}
          >
            By stage
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('STATUS');
              setSelectedStage('ALL');
            }}
            className={`rounded-lg px-3 py-1 text-xs font-semibold ${
              mode === 'STATUS'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                : 'text-gray-600 hover:bg-gray-50 dark:text-white/70 dark:hover:bg-white/[0.06]'
            }`}
          >
            By status
          </button>
        </div>
      </div>

      {/* Stage / Status summary cards */}
      <section className="mb-6 grid auto-rows-[112px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {stageCards.map((card) => {
          const isActive = card.id === selectedStage;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedStage(card.id)}
              className={`flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm transition duration-200 ease-out hover:bg-gray-50 hover:shadow-md active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06] ${
                isActive
                  ? 'border-emerald-300 ring-2 ring-emerald-300 shadow-lg shadow-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-500/10 dark:to-transparent'
                  : ''
              }`}
              aria-pressed={isActive}
            >
              {card.helper && (
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-white/60">
                  {card.helper}
                </p>
              )}
              <h3
                className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white"
                title={card.label}
              >
                {card.label}
              </h3>
              {typeof card.count === 'number' && (
                <span
                  className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-200'
                      : card.badgeClass
                  }`}
                >
                  {card.count} lead{card.count === 1 ? '' : 's'}
                </span>
              )}
            </button>
          );
        })}
      </section>

      <ComponentCard title="Lead stages">
        <div className="mb-4 flex flex-wrap items-center gap-3 sm:justify-end">
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <FilterBox
              value={q}
              onChange={setQ}
              placeholder="Search by name, mobile, status..."
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              startIcon={<RefreshCcw className="h-4 w-4" />}
              className="h-10"
            >
              Refresh
            </Button>
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExportOpen((v) => !v)}
                startIcon={<Download className="h-4 w-4" />}
                className="h-10"
              >
                Export
              </Button>
              {exportOpen && (
                <div className="absolute right-0 z-40 mt-2 min-w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">
                  <button
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                    onClick={() => {
                      console.log('LeadStages:onExport csv');
                      setExportOpen(false);
                    }}
                  >
                    Download CSV
                  </button>
                  <button
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                    onClick={() => {
                      console.log('LeadStages:onExport xlsx');
                      setExportOpen(false);
                    }}
                  >
                    Download Excel (.xlsx)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <MyLeads
          leads={filtered}
          pageSize={8}
          showHeader={false}
          loading={loading}
          showAssignedRm={isAdmin}
        />

        {error && (
          <div className="mt-3 text-sm text-rose-600">
            Failed to load: {String(error.message)}
          </div>
        )}
      </ComponentCard>
    </>
  );
}

function FilterBox({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 sm:flex-none">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-gray-200 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30 sm:w-80"
      />
    </div>
  );
}
