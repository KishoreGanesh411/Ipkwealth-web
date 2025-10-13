import { UserRoundCheck } from "lucide-react";
import { STAGE_META } from "@/components/sales/myleads/stageMeta";
// ⬇️ removed unused types to satisfy eslint
import { STATUS_OPTIONS, StatustCardProps } from "./interface/types";

/**
 * We map ASSIGNED to PENDING in the UI so RMs see “Pending” for new,
 * uncontacted leads. Also, the ASSIGNED option is hidden from the dropdown.
 */

export default function StatusCard({
  statusValue,
  stageValue,
  onStatusChange,
  onStageChange,
  disabled,
}: StatustCardProps) {
  // Show ASSIGNED as PENDING in the control
  const displayStatus = statusValue === "ASSIGNED" ? "PENDING" : statusValue ?? "";

  // Hide ASSIGNED from the list entirely
  const statusOptionsNoAssigned = STATUS_OPTIONS.filter((opt) => opt.value !== "ASSIGNED");

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex items-center gap-2">
        <UserRoundCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Update progress</h3>
      </div>

      <div className="mt-4 space-y-4">
        <fieldset>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/60">
            Lead status
          </label>
          <select
            value={displayStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            disabled={disabled}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
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
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/60">
            Pipeline stage
          </label>
          <select
            value={stageValue ?? ""}
            onChange={(e) => onStageChange(e.target.value)}
            disabled={disabled}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
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
        </fieldset>
      </div>
    </div>
  );
}
