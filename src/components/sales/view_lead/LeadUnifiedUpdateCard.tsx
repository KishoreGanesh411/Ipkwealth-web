import { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'react-toastify';
import { Flag, Milestone, Clock3, StickyNote, ChevronDown, CheckCircle2 } from 'lucide-react';

import {
  CHANGE_STAGE,
  CREATE_LEAD_EVENT,
  ADD_LEAD_NOTE,
  UPDATE_LEAD_REMARK,
  UPDATE_LEAD_STATUS,
} from './gql/view_lead.gql';
import { UPDATE_LEAD_DETAILS } from '@/components/sales/editLead/update_gql/update_lead.gql';
import { shouldAutoOpenLead } from './autoStatus';

import type { LeadStage, LeadStatus } from '@/components/sales/myleads/interface/type';

type Props = {
  leadId: string;
  currentStatus: LeadStatus | string;
  currentStage?: LeadStage | string | null;
  /** Pipeline status (PENDING/OPEN/...) for automation rules */
  pipelineStatus?: LeadStatus | string | null;
  onSaved?: () => void;
};

const CARD = 'rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] flex flex-col overflow-hidden';
const INPUT = 'rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white';
const BTN = 'rounded-xl bg-emerald-600 text-white px-4 py-2 border border-emerald-600 disabled:bg-zinc-300 disabled:text-white/70';

// Replace legacy status options with Stage Filter options for the Sales flow
const STATUS_OPTIONS: Array<string> = [
  'FUTURE_INTERESTED',
  'HIGH_PRIORITY',
  'LOW_PRIORITY',
  'NEED_CLARIFICATION',
  'NOT_ELIGIBLE',
  'NOT_INTERESTED',
  'ON_PROCESS',
];
const STAGE_OPTIONS: Array<LeadStage | string> = [
  'NEW_LEAD','FIRST_TALK_DONE','FOLLOWING_UP','CLIENT_INTERESTED','ACCOUNT_OPENED','NO_RESPONSE_DORMANT','NOT_INTERESTED_DORMANT','RISKY_CLIENT_DORMANT','HIBERNATED',
];
// REMOVED: CHANNEL_OPTIONS and OUTCOME_OPTIONS

export default function LeadUnifiedUpdateCard({
  leadId,
  currentStatus,
  currentStage,
  pipelineStatus,
  onSaved,
}: Props) {
  const [status, setStatus] = useState<string>(String(currentStatus ?? 'OPEN'));
  const [stage, setStage] = useState<string>(String(currentStage ?? 'NEW_LEAD'));
  const [followUp, setFollowUp] = useState<string>('');
  // REMOVED: channel and outcome state
  const [notes, setNotes] = useState<string>('');
  const [productExplained, setProductExplained] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  const [mutUpdateDetails] = useMutation(UPDATE_LEAD_DETAILS);
  const [mutStage] = useMutation(CHANGE_STAGE);
  const [mutUpdateStatus] = useMutation(UPDATE_LEAD_STATUS);
  const [mutInteraction] = useMutation(CREATE_LEAD_EVENT);
  const [mutNote] = useMutation(ADD_LEAD_NOTE);
  const [mutRemark] = useMutation(UPDATE_LEAD_REMARK);

  const nextFollowUpAt = useMemo(() => {
    if (!followUp) return null;
    const t = Date.parse(followUp);
    return isNaN(t) ? null : new Date(t).toISOString();
  }, [followUp]);

  // Once a lead has moved beyond the early pipeline (FIRST_TALK_DONE),
  // hide NEW_LEAD and FIRST_TALK_DONE from the stage dropdown so RMs
  // don't accidentally move it backwards.
  const stageOptionsForUi = useMemo(() => {
    const currentUpper = String(stage || '').toUpperCase();
    if (!currentUpper || currentUpper === 'NEW_LEAD' || currentUpper === 'FIRST_TALK_DONE') {
      return STAGE_OPTIONS;
    }
    return STAGE_OPTIONS.filter(
      (s) => String(s).toUpperCase() !== 'NEW_LEAD' && String(s).toUpperCase() !== 'FIRST_TALK_DONE',
    );
  }, [stage]);

  const isNewLeadStage = String(stage || '').toUpperCase() === 'NEW_LEAD';
  const showProductExplainedReminder = !isNewLeadStage && productExplained;

  const onSave = async () => {
    if (!leadId) return;
    const ops: Promise<any>[] = [];
    setSaving(true);
    try {
      // Stage filter change (shown as Status in UI)
      if (String(status) !== String(currentStatus)) {
        ops.push(
          mutUpdateDetails({
            variables: { input: { leadId, stageFilter: status } },
            update(cache, result) {
              const payload = (result?.data as any)?.updateLeadDetails;
              if (!payload?.id) return;
              cache.modify({
                id: cache.identify({ __typename: 'IpkLeaddEntity', id: payload.id }),
                fields: {
                  stageFilter: () => status,
                },
              });
            },
          })
        );
      }

      // stage change (always)
      ops.push(
        mutStage({
          variables: {
            input: {
              leadId,
              stage,
              note: notes || null,
              channel: 'CALL', // Hardcoded default as field is removed
              nextFollowUpAt: nextFollowUpAt ?? null,
              productExplained,
            },
          },
        })
      );

      // Auto-open rule: when first talk is done on a pending lead,
      // quietly flip pipeline status from PENDING -> OPEN so
      // marketing "Open leads" views stay accurate.
      if (
        shouldAutoOpenLead({
          previousStatus: pipelineStatus as string | null,
          nextStage: stage,
        })
      ) {
        ops.push(
          mutUpdateStatus({
            variables: { leadId, status: 'OPEN' as LeadStatus },
            update(cache, result) {
              const payload = (result?.data as any)?.updateLeadStatus;
              if (!payload?.id) return;
              cache.modify({
                id: cache.identify({ __typename: 'IpkLeaddEntity', id: payload.id }),
                fields: {
                  status: () => payload.status,
                  clientStage: () => payload.clientStage,
                  ...(payload.leadCode ? { leadCode: () => payload.leadCode } : {}),
                },
              });
            },
          })
        );
      }

      // timeline entry + remark mirror
      if (notes.trim()) {
        // Always log via interaction so we can persist channel and nextFollowUpAt (and optional outcome)
        ops.push(
          mutInteraction({
            variables: {
              input: {
                leadId,
                text: notes,
                channel: 'CALL', // Hardcoded default
                outcome: null, // Hardcoded default
                nextFollowUpAt: nextFollowUpAt ?? undefined,
                tags: ['ui:unified'],
              },
            },
          })
        );
        // Mirror the text into the simple remark field
        ops.push(mutRemark({ variables: { input: { leadId, remark: notes } } }));
      }

      await Promise.all(ops);
      toast.success('Saved. Timeline and remark updated.');
      setNotes('');
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={CARD}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-800 dark:text-white">
          <Flag className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold">Progress & Activity</h3>
        </div>
        <button className={BTN} onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* REORDERED: Fields are now in the requested order */}
      <div className="grid grid-cols-1 gap-5 flex-1">
        
        {/* Product explained */}
        {isNewLeadStage && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Was the product explained?</label>
            <div className="mt-1 flex items-center gap-4 text-xs text-gray-700 dark:text-white/80">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  className="h-3.5 w-3.5 accent-emerald-600"
                  checked={productExplained === true}
                  onChange={() => setProductExplained(true)}
                />
                <span>Yes</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  className="h-3.5 w-3.5 accent-emerald-600"
                  checked={productExplained === false}
                  onChange={() => setProductExplained(false)}
                />
                <span>No</span>
              </label>
            </div>
          </div>
        )}

        {showProductExplainedReminder && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-xs font-semibold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <div>
              <p>Product explained</p>
              <p className="text-[11px] font-medium text-emerald-700">Captured as yes</p>
            </div>
          </div>
        )}

        {/* Stage */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Pipeline stage</label>
          <div className="relative">
            <select className={`${INPUT} w-full appearance-none pr-8`} value={stage} onChange={(e) => setStage(e.target.value)}>
              {stageOptionsForUi.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <Milestone className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-zinc-400" />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Lead status</label>
          <div className="relative">
            <select className={`${INPUT} w-full appearance-none pr-8`} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-zinc-400" />
          </div>
        </div>

        {/* Follow-up */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Next follow-up</label>
          <div className="relative">
            <input type="datetime-local" className={`${INPUT} w-full`} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            <Clock3 className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-zinc-400" />
          </div>
        </div>

        {/* REMOVED: Channel */}

        {/* REMOVED: Outcome */}

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Notes (also saved as Remark)</label>
          <div className="relative">
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${INPUT} w-full resize-y`} placeholder="Add context, commitments, objections, etc." />
            <StickyNote className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-zinc-400" />
          </div>
        </div>
      </div>
    </section>
  );
}
