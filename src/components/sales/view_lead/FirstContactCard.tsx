import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';

type Props = {
  submitting?: boolean;
  onSubmit: (payload: {
    productExplained: boolean;
    channel: string; // GraphQL requires InteractionChannel!
    notExplainedReason?: string | null;
    nextFollowUpAt?: string | null;
    note?: string | null;
  }) => Promise<void> | void;
};

export default function FirstContactCard({ submitting = false, onSubmit }: Props) { 
  const [explained, setExplained] = useState<boolean>(true);
  const [channel, setChannel] = useState<string>('CALL');
  const [reason, setReason] = useState<string>('');
  const [next, setNext] = useState<string>('');
  const [note, setNote] = useState<string>('');

  return (
    <div className='rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-500/20 dark:bg-white/[0.04]'>
      <h3 className='text-sm font-semibold text-emerald-800 dark:text-emerald-200'>First contact</h3>
      <p className='mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/80'>Capture your first touch with the customer.</p>

      <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='sm:col-span-2'>
          <Label>Was the product explained?</Label>
          <div className='mt-1 flex items-center gap-6'>
            <label className='inline-flex items-center gap-2 text-sm text-gray-700 dark:text-white/80'>
              <input type='radio' className='h-4 w-4 accent-emerald-600' checked={explained} onChange={() => setExplained(true)} />
              Yes
            </label>
            <label className='inline-flex items-center gap-2 text-sm text-gray-700 dark:text-white/80'>
              <input type='radio' className='h-4 w-4 accent-emerald-600' checked={!explained} onChange={() => setExplained(false)} />
              No
            </label>
          </div>
        </div>

        {/* Channel (always present, schema requires it) */}
        <div>
          <Label>Channel</Label>
          <select
            className='mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:bg-white/10 dark:text-white/90'
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            disabled={submitting}
          >
            {['CALL','WHATSAPP','SMS','EMAIL','MEETING','OTHER'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Reason only when not explained */}
        {!explained && (
          <div>
            <Label>Reason (not explained)</Label>
            <input
              className='mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:bg-white/10 dark:text-white/90'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='e.g., Not reachable / needs callback'
              disabled={submitting}
            />
          </div>
        )}

        {/* Next follow-up: required to enable Save */}
        <div>
          <Label>
            Next follow-up <span className='text-rose-500'>(required)</span>
          </Label>
          <input
            type='datetime-local'
            className='mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:bg-white/10 dark:text-white/90'
            value={next}
            onChange={(e) => setNext(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className='sm:col-span-2'>
          <Label>Notes</Label>
          <textarea
            rows={3}
            className='mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:bg-white/10 dark:text-white/90'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='Context from the conversation'
            disabled={submitting}
          />
        </div>
      </div>

      <div className='mt-4 flex justify-end'>
        <Button
          size='sm'
          onClick={async () => {
            await onSubmit({
              productExplained: explained,
              channel,
              notExplainedReason: explained ? null : (reason || null),
              nextFollowUpAt: next ? new Date(next).toISOString() : null,
              note: note || null,
            });
          }}
          disabled={submitting || !next}
        >
          {submitting ? 'Saving…' : 'Save first contact'}
        </Button>
      </div>
    </div>
  );
}

