import { useMemo, useState } from 'react';

import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PageMeta from '@/components/common/PageMeta';
import MyLeads from '@/components/sales/myleads/MyLeads';
import { SAMPLE_LEADS } from '@/components/sales/myleads/mockData';
import { STAGE_META, STAGE_SEQUENCE } from '@/components/sales/myleads/stageMeta';
import { LeadStage } from '@/components/sales/myleads/interface/type';

type StageTab = {
  id: 'ALL' | LeadStage;
  label: string;
};

const STAGE_TABS: StageTab[] = [
  { id: 'ALL', label: 'All stages' },
  ...STAGE_SEQUENCE.map((stage) => ({
    id: stage,
    label: STAGE_META[stage].label,
  })),
];

export default function LeadStagesPage() {
  const [selected, setSelected] = useState<'ALL' | LeadStage>('ALL');

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

  const filtered = useMemo(() => {
    if (selected === 'ALL') return SAMPLE_LEADS;
    return SAMPLE_LEADS.filter((lead) => lead.status === selected);
  }, [selected]);

  return (
    <>
      <PageMeta title='Lead stages' description='Track pipeline health by stage' />
      <PageBreadcrumb pageTitle='Lead Stages' items={[{ label: 'Assigned Leads', href: '/sales/assigned' }]} />

      <section className='mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {STAGE_TABS.filter((tab) => tab.id !== 'ALL').map((tab) => {
          const stage = tab.id as LeadStage;
          const meta = STAGE_META[stage];
          const count = stageCounts.get(stage) ?? 0;
          return (
            <article
              key={stage}
              className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-emerald-200 dark:border-white/10 dark:bg-white/[0.02] ${
                selected === stage ? 'ring-2 ring-emerald-400' : ''
              }`}
            >
              <p className='text-xs font-medium uppercase text-gray-500 dark:text-white/60'>Stage</p>
              <h3 className='mt-1 text-base font-semibold text-gray-900 dark:text-white'>{meta.label}</h3>
              <span className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.pillClass}`}>
                {count} lead{count === 1 ? '' : 's'}
              </span>
            </article>
          );
        })}
      </section>

      <ComponentCard title='Lead stages'>
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          {STAGE_TABS.map((tab) => {
            const isActive = tab.id === selected;
            return (
              <button
                key={tab.id}
                onClick={() => setSelected(tab.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow'
                    : 'border-gray-200 text-gray-700 hover:border-emerald-200 hover:text-emerald-700 dark:border-white/10 dark:text-gray-200 dark:hover:border-emerald-300 dark:hover:text-emerald-200'
                }`}
              >
                {tab.label}
                {tab.id !== 'ALL' && (
                  <span className='ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white/70 px-2 text-xs font-semibold text-emerald-600 dark:bg-white/[0.08] dark:text-emerald-200'>
                    {stageCounts.get(tab.id as LeadStage) ?? 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <MyLeads leads={filtered} pageSize={8} />
      </ComponentCard>
    </>
  );
}
