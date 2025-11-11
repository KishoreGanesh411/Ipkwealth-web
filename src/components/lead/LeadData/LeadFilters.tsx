// src/components/lead/LeadData/LeadFilters.tsx
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import DatePicker from '@/components/form/date-picker';
import { leadOptions } from '@/components/lead/types';

export type LeadFilters = {
  from?: string | null; // YYYY-MM-DD
  to?: string | null;   // YYYY-MM-DD
  rm?: string | 'UNASSIGNED' | null;
  source?: string | null; // value from leadOptions
};

type Props = {
  open: boolean;
  onClose: () => void;
  value: LeadFilters;
  onApply: (next: LeadFilters) => void;
  rmOptions?: string[]; // list of RM names to choose from
};

function fmt(d?: Date | null): string | undefined {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function LeadFiltersModal({ open, onClose, value, onApply, rmOptions = [] }: Props) {
  const [local, setLocal] = useState<LeadFilters>({ ...value });

  useEffect(() => setLocal({ ...value }), [value, open]);

  const clear = () => setLocal({ from: null, to: null, rm: null, source: null });

  const hasChanges = useMemo(() => {
    return (
      (local.from || null) !== (value.from || null) ||
      (local.to || null) !== (value.to || null) ||
      (local.rm || null) !== (value.rm || null) ||
      (local.source || null) !== (value.source || null)
    );
  }, [local, value]);

  const apply = () => {
    onApply({
      from: local.from || null,
      to: local.to || null,
      rm: local.rm || null,
      source: local.source || null,
    });
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} className='max-w-[720px] w-[92vw]'>
      <div className='p-5 sm:p-6'>
        <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>Filter Leads</h3>

        <div className='mt-4 grid gap-4 sm:grid-cols-2'>
          <div className='sm:col-span-2'>
            <DatePicker
              id='lead-filter-range'
              label='Lead Date'
              mode='range'
              placeholder='Select a date range'
              onChange={(dates: any) => {
                // flatpickr range returns [Date, Date?]
                if (Array.isArray(dates)) {
                  const from = fmt(dates[0] ?? null);
                  const to = fmt(dates[1] ?? null);
                  setLocal((p) => ({ ...p, from: from ?? null, to: to ?? null }));
                }
              }}
            />
            {(local.from || local.to) && (
              <p className='mt-1 text-xs text-gray-500 dark:text-white/60'>
                {local.from ?? '..'} — {local.to ?? '..'}
              </p>
            )}
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-white/80'>Assigned RM</label>
            <select
              value={local.rm ?? ''}
              onChange={(e) => setLocal((p) => ({ ...p, rm: (e.target.value || null) as any }))}
              className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700'
            >
              <option value=''>All</option>
              <option value='UNASSIGNED'>Unassigned</option>
              {rmOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-white/80'>Lead Source</label>
            <select
              value={local.source ?? ''}
              onChange={(e) => setLocal((p) => ({ ...p, source: e.target.value || null }))}
              className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700'
            >
              <option value=''>All</option>
              {leadOptions.map((o) => (
                <option key={o.value} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='mt-6 flex items-center justify-end gap-3'>
          <button
            type='button'
            onClick={clear}
            className='rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/5'
          >
            Clear
          </button>
          <button
            type='button'
            onClick={apply}
            disabled={!hasChanges}
            className='rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-brand-600'
          >
            Apply Filters
          </button>
        </div>
      </div>
    </Modal>
  );
}