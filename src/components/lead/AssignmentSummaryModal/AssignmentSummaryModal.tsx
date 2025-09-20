import React from "react";
import { Modal } from "../../ui/modal";

export type AssignSummary = {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  byRm: Record<string, number>; // { "Haripriya": 23, "Barath": 17, ... }
};

type Props = {
  open: boolean;
  onClose: () => void;
  summary: AssignSummary | null;
};

export default function AssignmentSummaryModal({ open, onClose, summary }: Props) {
  if (!summary) return null;

  const entries = Object.entries(summary.byRm).sort((a, b) => b[1] - a[1]); // highest first

  return (
    <Modal isOpen={open} onClose={onClose} className="w-[92vw] max-w-[720px]">
      <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Assignment Summary</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-white/70">
            All valid rows have been processed. Here’s the breakdown by RM.
          </p>
        </div>

        {/* Overall numbers */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={summary.total} />
          <Stat label="Success" value={summary.success} accent="text-emerald-600" />
          <Stat label="Skipped" value={summary.skipped} accent="text-amber-600" />
          <Stat label="Failed" value={summary.failed} accent="text-rose-600" />
        </div>

        {/* Per-RM list */}
        <div className="mt-5">
          <div className="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">
            Assigned per RM ({entries.length} active)
          </div>
          <ol className="space-y-2">
            {entries.length === 0 && (
              <li className="text-sm text-gray-500 dark:text-gray-400">No RM assignments recorded.</li>
            )}
            {entries.map(([rm, count], idx) => (
              <li
                key={rm || `rm-${idx}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-white/90"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-white/70">
                    {idx + 1}
                  </span>
                  <span>{rm || "—"}</span>
                </span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <div className={`text-xl font-semibold ${accent ?? "text-gray-900 dark:text-white"}`}>{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
