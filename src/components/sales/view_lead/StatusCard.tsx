import { useMemo, useState } from "react";
import { Info, UserRoundCheck } from "lucide-react";
import {
  STAGE_META,
  STATUS_OPTIONS,
  DORMANT_REASONS,
  isDormantStage,
} from "@/components/sales/leadMeta/statusStageMeta";
import type { StatustCardProps } from "./interface/types";
import { resolveStageDisplay } from "./interface/utils";

/**
 * StatusCard
 * - Centralised options for status and stage
 * - Inline dormant-reason prompt for *_DORMANT/HIBERNATED stages when unified handler is provided
 * - Shows a tiny current-stage pill for quick visual context
 */
export default function StatusCard({
  statusValue,
  stageValue,
  onStatusChange,
  onStageChange,
  disabled,
  onStatusStageChange,
}: StatustCardProps) {
  // Show ASSIGNED as PENDING in the control
  const displayStatus = statusValue === "ASSIGNED" ? "PENDING" : statusValue ?? "";

  // Hide ASSIGNED from the list entirely
  const statusOptionsNoAssigned = STATUS_OPTIONS.filter((opt) => opt.value !== "ASSIGNED");

  // Dormant handling state
  const [pendingStage, setPendingStage] = useState<string | null>(null);
  const [dormantReason, setDormantReason] = useState<string | null>(null);

  const currentStageMeta = useMemo(
    () => (stageValue ? STAGE_META[String(stageValue)] : undefined),
    [stageValue]
  );
  const stageHint = useMemo(() => {
    const s = resolveStageDisplay({ rawStage: String(stageValue ?? ""), normalizedStage: stageValue as any, status: displayStatus });
    return s.hint;
  }, [stageValue, displayStatus]);

  return (
    <div className="card card-padded">
      <div className="flex items-center gap-2">
        <UserRoundCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
        <h3 className="section-title">Update progress</h3>
      </div>

      <div className="mt-4 space-y-4">
        <fieldset>
          <label className="form-label">
            Lead status
          </label>
          <select
            value={displayStatus}
            onChange={(e) => {
              const val = e.target.value;
              if (onStatusStageChange) onStatusStageChange({ newStatus: val });
              else onStatusChange(val);
            }}
            disabled={disabled}
            className="form-select"
          >
            <option value="" disabled>
              Select status
            </option>
            {statusOptionsNoAssigned.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset>
          <label className="form-label">
            Pipeline stage
          </label>
          <select
            value={pendingStage ?? stageValue ?? ""}
            onChange={(e) => {
              const nxt = e.target.value;
              if (isDormantStage(nxt) && onStatusStageChange) {
                setPendingStage(nxt);
                setDormantReason(null);
                return;
              }
              setPendingStage(null);
              if (onStatusStageChange) onStatusStageChange({ newStage: nxt });
              else onStageChange(nxt);
            }}
            disabled={disabled}
            className="form-select"
          >
            <option value="" disabled>
              Select stage
            </option>
            {Object.entries(STAGE_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
          {currentStageMeta && (
            <p className="mt-2 inline-flex items-center gap-2 text-[11px] text-gray-500 dark:text-white/60">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${currentStageMeta.pillClass}`}
                title={stageHint || undefined}
              >
                {currentStageMeta.label}
              </span>
              <span className="inline-flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                <span>Stage hint available</span>
              </span>
            </p>
          )}
        </fieldset>

        {pendingStage && isDormantStage(pendingStage) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
            <div className="mb-2 font-semibold">Dormant stage selected — choose a reason</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={dormantReason ?? ""}
                onChange={(e) => setDormantReason(e.target.value || null)}
                className="h-9 w-full rounded-lg border border-amber-300 bg-white px-2 text-xs text-amber-900 dark:border-amber-400/40 dark:bg-white/5 dark:text-amber-100 sm:max-w-xs"
              >
                <option value="" disabled>
                  Choose reason
                </option>
                {DORMANT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!onStatusStageChange || !pendingStage) return;
                    onStatusStageChange({ newStage: pendingStage, dormantReason });
                    setPendingStage(null);
                    setDormantReason(null);
                  }}
                  disabled={!dormantReason || disabled}
                  className="inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingStage(null);
                    setDormantReason(null);
                  }}
                  className="inline-flex items-center rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:border-amber-400/40 dark:text-amber-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
