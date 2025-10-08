import { type FormEvent } from "react";
import { PlusCircle, NotebookPen, Loader2 } from "lucide-react";
import type { EventFormState } from "./types";

type Props = {
  form: EventFormState;
  onChange: (state: EventFormState) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitting?: boolean;
};

export default function AddEventCard({ form, onChange, onSubmit, submitting }: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex items-center gap-2">
        <PlusCircle className="h-5 w-5 text-emerald-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Log activity</h3>
      </div>

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <fieldset>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/60">Event type</label>
          <select
            value={form.type}
            onChange={(e) => onChange({ ...form, type: e.target.value })}
            disabled={submitting}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
          >
            <option value="NOTE">Note</option>
            <option value="CALL">Phone call</option>
            <option value="MEETING">Meeting</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="INTERACTION">Interaction</option>
          </select>
        </fieldset>

        <fieldset>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/60">Notes</label>
          <textarea
            value={form.note}
            onChange={(e) => onChange({ ...form, note: e.target.value })}
            rows={4}
            placeholder="Add call summary, commitments, objections..."
            disabled={submitting}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          />
        </fieldset>

        <fieldset>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/60">Next follow-up</label>
          <input
            type="datetime-local"
            value={form.followUpOn}
            onChange={(e) => onChange({ ...form, followUpOn: e.target.value })}
            disabled={submitting}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
          />
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <NotebookPen className="h-4 w-4" /> Log event
            </>
          )}
        </button>
      </form>
    </div>
  );
}
