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
import { LeadStage } from '@/components/sales/myleads/interface/type';
import Button from '@/components/ui/button/Button';
import { LEADS_PAGED, MY_ASSIGNED_LEADS } from '@/core/graphql/lead/lead.gql';

type StageFilter = 'ALL' | LeadStage;

type StageCardInfo = {
  id: StageFilter;
  label: string;
  helper: string;
  count: number;
  badgeClass: string;
};

export default function LeadStagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MARKETING';
  const [selectedStage, setSelectedStage] = useState<StageFilter>('ALL');
  const [q, setQ] = useState('');
  const [exportOpen, setExportOpen] = useState(false);

  // Live data: fetch assigned leads for RM; all leads for Admin/Marketing
  const { data, loading, error, refetch } = useQuery(
    isAdmin ? LEADS_PAGED : MY_ASSIGNED_LEADS,
    { variables: { args: { page: 1, pageSize: 200, archived: false, status: null, search: null } }, fetchPolicy: 'cache-and-network' }
  );

  // Map GQL -> MyLeads interface
  const allLeads = useMemo(() => {
    const nodes = (isAdmin ? (data as any)?.leads?.items : (data as any)?.myAssignedLeads?.items) ?? [];
    return nodes.map((n: any) => ({
      id: n.id,
      leadCode: n.leadCode ?? null,
      name: (n.name || [n.firstName, n.lastName].filter(Boolean).join(' ')) ?? '-',
      email: n.email ?? null,
      mobile: n.phone ?? null,
      location: undefined,
      agingDays: (n.approachAt || n.createdAt) ? Math.max(0, Math.floor((Date.now() - Date.parse(n.approachAt || n.createdAt)) / 86400000)) : undefined,
      leadSource: n.leadSource ?? '-',
      // For the Status column we now show the new lead stage filter when present
      status: n.stageFilter || n.clientStage || n.status || undefined,
      clientStage: n.clientStage || undefined,
      lastContactedAt: n.lastContactedAt ?? null,
      assignedRm: n.assignedRM ?? null,
      isNew: (n.clientStage === 'NEW_LEAD') || !n.lastContactedAt,
    }));
  }, [isAdmin, (data as any)?.leads?.items, (data as any)?.myAssignedLeads?.items]);

  const stageCounts = useMemo(() => {
    const counts = new Map<LeadStage, number>();
    STAGE_SEQUENCE.forEach((stage) => counts.set(stage, 0));
    allLeads.forEach((lead: any) => {
      const st = (lead.clientStage as LeadStage | undefined) ?? undefined;
      if (st && counts.has(st)) counts.set(st, (counts.get(st) ?? 0) + 1);
    });
    return counts;
  }, [allLeads]);

  const stageCards = useMemo<StageCardInfo[]>(() => {
    return [
      {
        id: 'ALL',
        label: 'All stages',
        helper: 'Overview',
        count: allLeads.length,
        badgeClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200',
      },
      ...STAGE_SEQUENCE.map((stage) => {
        const meta = STAGE_META[stage];
        return {
          id: stage,
          label: meta.label,
          helper: 'Stage',
          count: stageCounts.get(stage) ?? 0,
          badgeClass: meta.pillClass,
        } as StageCardInfo;
      }),
    ];
  }, [stageCounts]);

  const filteredByStage = useMemo(() => {
    if (selectedStage === 'ALL') return allLeads;
    return allLeads.filter((lead: any) => lead.clientStage === selectedStage);
  }, [selectedStage, allLeads]);

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
      <PageMeta title='Lead stages' description='Track pipeline health by stage' />
      <PageBreadcrumb pageTitle='Lead Stages' items={[{ label: 'My Leads', href: '/sales/stages' }]} />

      {/* Compact, responsive stage grid: fills available width without large right gaps */}
      <section className='mb-6 grid auto-rows-[112px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3'>
        {stageCards.map((card) => {
          const isActive = card.id === selectedStage;
          return (
            <button
              key={card.id}
              type='button'
              onClick={() => setSelectedStage(card.id)}
              className={`flex h-full flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-colors duration-150 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06] ${
                isActive ? 'border-emerald-300 ring-1 ring-emerald-200 dark:border-emerald-400/60 dark:ring-emerald-400/40' : ''
              }`}
              aria-pressed={isActive}
            >
              <p className='text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-white/60'>
                {card.helper}
              </p>
              <h3 className='mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white' title={card.label}>
                {card.label}
              </h3>
              <span
                className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  isActive && card.id === 'ALL'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                    : card.badgeClass
                }`}
              >
                {card.count} lead{card.count === 1 ? '' : 's'}
              </span>
            </button>
          );
        })}
      </section>

      <ComponentCard title='Lead stages'>
        <div className='mb-4 flex flex-wrap items-center gap-3 sm:justify-end'>
          <div className='flex w-full items-center gap-3 sm:w-auto'>
            <FilterBox value={q} onChange={setQ} placeholder='Search by name, mobile, status...' />
            <Button
              size='sm'
              variant='outline'
              onClick={() => refetch()}
              startIcon={<RefreshCcw className='h-4 w-4' />}
              className='h-10'
            >
              Refresh
            </Button>
            <div className='relative'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setExportOpen((v) => !v)}
                startIcon={<Download className='h-4 w-4' />}
                className='h-10'
              >
                Export
              </Button>
              {exportOpen && (
                <div className='absolute right-0 z-40 mt-2 min-w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark'>
                  <button
                    className='block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.06]'
                    onClick={() => {
                      console.log('LeadStages:onExport csv');
                      setExportOpen(false);
                    }}
                  >
                    Download CSV
                  </button>
                  <button
                    className='block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.06]'
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

        <MyLeads leads={filtered} pageSize={8} showHeader={false} loading={loading} showAssignedRm={isAdmin} />
        {error && (
          <div className='mt-3 text-sm text-rose-600'>Failed to load: {String(error.message)}</div>
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
    <div className='relative flex-1 sm:flex-none'>
      <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='h-10 w-full rounded-xl border border-gray-200 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30 sm:w-80'
      />
    </div>
  );
}

