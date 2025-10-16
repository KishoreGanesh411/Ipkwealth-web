import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "react-toastify";
import { PencilLine, Save, X } from "lucide-react";

import { UPDATE_LEAD_BIO } from "./gql/view_lead.gql";

export default function BioCard({
  leadId,
  bioText,
  onUpdated,
}: {
  leadId: string;
  bioText?: string | null;
  onUpdated?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState<string>(bioText ?? "");
  const [mutate, { loading }] = useMutation(UPDATE_LEAD_BIO);

  const remaining = useMemo(() => 1000 - (text?.length ?? 0), [text]);

  const onSave = async () => {
    const payload = {
      leadId,
      bioText: text?.trim() || "",
    } as any;
    try {
      await mutate({ variables: { input: payload } });
      toast.success("Bio updated");
      setEditing(false);
      onUpdated?.();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update bio");
    }
  };

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Lead bio</h3>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:text-gray-200"
          >
            <PencilLine className="h-4 w-4" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-sm text-gray-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 whitespace-pre-wrap">
          {bioText?.trim() ? bioText : "Add a short background, preferences, or context."}
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            rows={5}
            placeholder="Add a concise background: goals, risk appetite, preferences, relations, etc."
            className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-emerald-300 focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
          />
          <div className="mt-1 text-right text-[11px] text-gray-500 dark:text-white/50">{remaining} chars left</div>
        </div>
      )}
    </section>
  );
}

