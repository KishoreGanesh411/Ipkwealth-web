import type { FormEvent } from "react";
import { useMemo } from "react";
import { PlusCircle, NotebookPen, Loader2, PhoneCall, CalendarClock, MessageSquare } from "lucide-react";
import type { EventFormState } from "./interface/types";
import { isDormantStage, STAGE_META } from "@/components/sales/leadMeta/statusStageMeta";

type Props = {
  form: EventFormState;
  onChange: (state: EventFormState) => void;
  // Legacy handler (kept for backward compatibility)
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  // New handler for richer event creation
  onCreateEvent?: (args: EventFormState & { reactivationEnabled?: boolean }) => void;
  submitting?: boolean;
  currentStage?: string | null;
};

export default function AddEventCard({
  form,
  onChange,
  onSubmit,
  onCreateEvent,
  submitting,
  currentStage,
}: Props) {
  const isInteraction = useMemo(() => ["CALL", "MEETING", "WHATSAPP", "INTERACTION"].includes(form.type), [form.type]);
  const dormant = isDormantStage(currentStage);
  return (
    <div className="card card-padded flex h-full flex-col">
      <div className="flex items-center gap-2">
        <PlusCircle className="h-5 w-5 text-emerald-500" aria-hidden="true" />
        <h3 className="section-title">
          Log activity
        </h3>
      </div>

      <form
        className="mt-4 flex flex-1 flex-col gap-4"
        onSubmit={(e) => {
          if (onCreateEvent) {
            e.preventDefault();
            onCreateEvent({ ...form, reactivationEnabled: dormant && Boolean(form.reactivateToStage) });
          } else {
            onSubmit?.(e);
          }
        }}
      >
        <fieldset>
          <label className="form-label">
            Event type
          </label>
          <select
            value={form.type}
            onChange={(e) => onChange({ ...form, type: e.target.value })}
            disabled={submitting}
            className="form-select"
          >
            <option value="NOTE">Note</option>
            <option value="CALL">Phone call</option>
            <option value="MEETING">Meeting</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="INTERACTION">Interaction</option>
          </select>
        </fieldset>

        {isInteraction && (
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset>
              <label className="form-label">
                Channel
              </label>
              <select
                value={form.channel ?? ""}
                onChange={(e) => onChange({ ...form, channel: e.target.value })}
                disabled={submitting}
                className="form-select"
              >
                <option value="" disabled>
                  Select channel
                </option>
                <option value="PHONE">Phone</option>
                <option value="MEETING">Meeting</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
              </select>
            </fieldset>

            <fieldset>
              <label className="form-label">
                Outcome
              </label>
              <select
                value={form.outcome ?? ""}
                onChange={(e) => onChange({ ...form, outcome: e.target.value })}
                disabled={submitting}
                className="form-select"
              >
                <option value="" disabled>
                  Select outcome
                </option>
                <option value="ANSWERED">Answered</option>
                <option value="NO_ANSWER">No answer</option>
                <option value="INTERESTED">Interested</option>
                <option value="NOT_INTERESTED">Not interested</option>
                <option value="FOLLOW_UP_NEEDED">Follow-up needed</option>
                <option value="WRONG_NUMBER">Wrong number</option>
              </select>
            </fieldset>
          </div>
        )}

        <fieldset>
          <label className="form-label">
            Notes
          </label>
          <textarea
            value={form.note}
            onChange={(e) => onChange({ ...form, note: e.target.value })}
            rows={3}
            placeholder="Add summary, commitments..."
            disabled={submitting}
            className="form-textarea"
          />
        </fieldset>

        <fieldset>
          <label className="form-label">
            Next follow-up
          </label>
          <input
            type="datetime-local"
            value={form.followUpOn}
            onChange={(e) => onChange({ ...form, followUpOn: e.target.value })}
            disabled={submitting}
            className="form-input"
          />
        </fieldset>

        {dormant && (
          <fieldset className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 text-xs text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-100">
            <div className="mb-2 inline-flex items-center gap-2 font-semibold">
              <PhoneCall className="h-3.5 w-3.5" /> Reactivate stage with this activity?
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-[11px]">Move to</span>
              <select
                value={form.reactivateToStage ?? "FOLLOWING_UP"}
                onChange={(e) => onChange({ ...form, reactivateToStage: e.target.value })}
                className="h-9 w-full rounded-lg border border-violet-300 bg-white px-2 text-xs text-violet-900 dark:border-violet-400/40 dark:bg-white/5 dark:text-violet-100 sm:max-w-xs"
              >
                <option value="FOLLOWING_UP">Following up</option>
                <option value="FIRST_TALK_DONE">First talk done</option>
                <option value="CLIENT_INTERESTED">Client interested</option>
              </select>
              <div className="inline-flex items-center gap-2 text-[11px] text-violet-700 dark:text-violet-200">
                <CalendarClock className="h-3.5 w-3.5" /> This helps keep actives current
              </div>
            </div>
          </fieldset>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-success mt-2 w-full sm:mt-auto"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              {isInteraction ? <PhoneCall className="h-4 w-4" /> : <NotebookPen className="h-4 w-4" />}
              Log event
            </>
          )}
        </button>
      </form>
    </div>
  );
}
