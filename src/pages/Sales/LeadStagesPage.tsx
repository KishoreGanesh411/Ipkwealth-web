import { useMemo, useState } from 'react';
import { Download, RefreshCcw, Search } from 'lucide-react';

import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PageMeta from '@/components/common/PageMeta';
import MyLeads from '@/components/sales/myleads/MyLeads';
import { SAMPLE_LEADS } from '@/components/sales/myleads/mockData';
import { STAGE_META, STAGE_SEQUENCE } from '@/components/sales/myleads/stageMeta';
import { LeadStage } from '@/components/sales/myleads/interface/type';
import Button from '@/components/ui/button/Button';

type StageFilter = 'ALL' | LeadStage;

type StageCardInfo = {
  id: StageFilter;
  label: string;
  helper: string;
  count: number;
  badgeClass: string;
};

export default function LeadStagesPage() {
  const [selectedStage, setSelectedStage] = useState<StageFilter>('ALL');
  const [q, setQ] = useState('');
  const [exportOpen, setExportOpen] = useState(false);

  const stageCounts = useMemo(() => {
    const counts = new Map<LeadStage, number>();
    STAGE_SEQUENCE.forEach((stage) => counts.set(stage, 0));
    SAMPLE_LEADS.forEach((lead) => {
      if (lead.status) {
        const current = counts.get(lead.status) ?? 0;
        counts.set(lead.status, current + 1);
      }
    });
    return counts;
  }, []);

  const stageCards = useMemo<StageCardInfo[]>(() => {
    return [
      {
        id: 'ALL',
        label: 'All stages',
        helper: 'Overview',
        count: SAMPLE_LEADS.length,
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
    if (selectedStage === 'ALL') {
      return SAMPLE_LEADS;
    }
    return SAMPLE_LEADS.filter((lead) => lead.status === selectedStage);
  }, [selectedStage]);

  const filtered = useMemo(() => {
    const dataset = filteredByStage;
    if (!q.trim()) return dataset;
    const qq = q.toLowerCase();
    return dataset.filter((lead) =>
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
      <PageBreadcrumb pageTitle='Lead Stages' items={[{ label: 'Assigned Leads', href: '/sales/assigned' }]} />

      <section className='mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {stageCards.map((card) => {
          const isActive = card.id === selectedStage;
          return (
            <button
              key={card.id}
              type='button'
              onClick={() => setSelectedStage(card.id)}
              className={`rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-emerald-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-300 dark:border-white/10 dark:bg-white/[0.02] ${
                isActive ? 'border-emerald-300 ring-2 ring-emerald-300 dark:border-emerald-400/60 dark:ring-emerald-400/60' : ''
              }`}
              aria-pressed={isActive}
            >
              <p className='text-xs font-medium uppercase text-gray-500 dark:text-white/60'>
                {card.helper}
              </p>
              <h3 className='mt-1 text-base font-semibold text-gray-900 dark:text-white'>
                {card.label}
              </h3>
              <span
                className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive && card.id === 'ALL'
                    ? 'bg-emerald-500 text-white'
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
              onClick={() => console.log('LeadStages:onRefresh')}
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

        <MyLeads leads={filtered} pageSize={8} showHeader={false} />
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
