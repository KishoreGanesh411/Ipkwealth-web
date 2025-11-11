import { useEffect, useMemo, useState } from "react";
import { Info, Loader2, RotateCcw, UserRoundCheck } from "lucide-react";

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
 * - Users can adjust lead status & stage, then commit via an explicit Save button.
 * - Dormant / hibernated stages prompt for a required dormant reason before saving.
 * - A reset action lets users discard unsaved edits.
 */
export default function StatusCard({
  statusValue,
  stageValue,
  onStatusChange,
  onStageChange,
  disabled,
  saving = false,
  onStatusStageChange,
}: StatustCardProps) {
  const normalizedStatus = String(statusValue ?? "") === "ASSIGNED" ? "PENDING" : (statusValue ?? "");
  const normalizedStage = stageValue ?? "";

  const [editedStatus, setEditedStatus] = useState<string>(normalizedStatus);
  const [editedStage, setEditedStage] = useState<string>(normalizedStage);
  const [dormantReason, setDormantReason] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync local draft with incoming props (e.g. after save/refetch)
  useEffect(() => {
    setEditedStatus(normalizedStatus);
  }, [normalizedStatus]);

  useEffect(() => {
    setEditedStage(normalizedStage);
    setDormantReason(null);
  }, [normalizedStage]);

  const stageDraft = editedStage || "";

  const currentStageMeta = useMemo(() => {
    const key = stageDraft || normalizedStage;
    return key ? STAGE_META[String(key)] : undefined;
  }, [stageDraft, normalizedStage]);

  const stageDisplay = useMemo(() => {
    const stageForDisplay = stageDraft || normalizedStage;
    return resolveStageDisplay({
      rawStage: stageForDisplay,
      normalizedStage: (stageForDisplay || undefined) as any,
      status: (editedStatus || normalizedStatus) as any,
    });
  }, [stageDraft, normalizedStage, editedStatus, normalizedStatus]);

  const stageHint = stageDisplay.hint;
  const showDormantReason =
    Boolean(editedStage) && editedStage !== normalizedStage && isDormantStage(editedStage);

  const hasChanges =
    (editedStatus && editedStatus !== normalizedStatus) ||
    (editedStage && editedStage !== normalizedStage);

  const combinedDisabled = disabled || saving;
  const requiresReason = showDormantReason && (!dormantReason || !dormantReason.trim());
  const saveDisabled = combinedDisabled || !hasChanges || requiresReason;

  const statusOptions = STATUS_OPTIONS.filter((opt) => opt.value !== "ASSIGNED");

  const handleReset = () => {
    setEditedStatus(normalizedStatus);
    setEditedStage(normalizedStage);
    setDormantReason(null);
    setValidationError(null);
  };

  const handleSave = () => {
    setValidationError(null);

    const updates: { newStatus?: string; newStage?: string; dormantReason?: string | null } = {};

    if (editedStatus && editedStatus !== normalizedStatus) {
      updates.newStatus = editedStatus;
    }
    if (editedStage && editedStage !== normalizedStage) {
      updates.newStage = editedStage;
      if (isDormantStage(editedStage)) {
        if (!dormantReason || !dormantReason.trim()) {
          setValidationError("Choose a dormant reason before saving.");
          return;
        }
        updates.dormantReason = dormantReason;
      }
    }

    if (!updates.newStatus && !updates.newStage) {
      setValidationError("No changes to save.");
      return;
    }

    if (onStatusStageChange) {
      onStatusStageChange(updates);
    } else {
      if (updates.newStatus) onStatusChange(updates.newStatus);
      if (updates.newStage) onStageChange(updates.newStage);
    }
  };

  return (
    <div className="card card-padded flex h-full flex-col">
      <div className="flex items-center gap-2">
        <UserRoundCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
        <h3 className="section-title">Update progress</h3>
      </div>

      <form
        className="mt-4 flex flex-1 flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!saveDisabled) handleSave();
        }}
      >
        <fieldset>
          <label className="form-label">Lead status</label>
          <select
            value={editedStatus || ""}
            onChange={(event) => {
              setEditedStatus(event.target.value);
              setValidationError(null);
            }}
            disabled={combinedDisabled}
            className="form-select"
          >
            <option value="" disabled>
              Select status
            </option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset>
          <label className="form-label">Pipeline stage</label>
          <select
            value={editedStage || ""}
            onChange={(event) => {
              const nextStage = event.target.value;
              setEditedStage(nextStage);
              setValidationError(null);
              if (!isDormantStage(nextStage)) setDormantReason(null);
            }}
            disabled={combinedDisabled}
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
              {stageHint && (
                <span className="inline-flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  <span>Stage hint available</span>
                </span>
              )}
            </p>
          )}
        </fieldset>

        {showDormantReason && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
            <div className="mb-2 font-semibold">Dormant stage selected - choose a reason.</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={dormantReason ?? ""}
                onChange={(event) => setDormantReason(event.target.value || null)}
                className="h-9 w-full rounded-lg border border-amber-300 bg-white px-2 text-xs text-amber-900 dark:border-amber-400/40 dark:bg-white/5 dark:text-amber-100 sm:max-w-xs"
              >
                <option value="" disabled>
                  Choose reason
                </option>
                {DORMANT_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-amber-700 dark:text-amber-100">
                Captures why the lead moved to a dormant state.
              </span>
            </div>
          </div>
        )}

        {validationError && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{validationError}</p>
        )}

        <div className="mt-auto flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              disabled={combinedDisabled}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20 dark:hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
          <button type="submit" disabled={saveDisabled} className="btn btn-success w-full sm:w-auto">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save progress"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
