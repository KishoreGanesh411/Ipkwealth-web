import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { LeadStage } from "@/components/sales/myleads/interface/type";
import { STAGE_META } from "@/components/sales/myleads/stageMeta";

/* ------------------------------ Basics ---------------------------------- */

export function initials(name?: string | null) {
  if (!name) return "NA";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function humanize(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    .join(" ");
}

/* ----------------------------- Formatting -------------------------------- */

export function formatEventTimestamp(value: string) {
  try {
    const d = parseISO(value);
    return `${format(d, "MMM d, yyyy 'at' h:mm a")} (${formatDistanceToNow(d, { addSuffix: true })})`;
  } catch {
    return value;
  }
}

export function formatRelative(value?: string | null) {
  if (!value) return "";
  try {
    const d = parseISO(value);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return value;
  }
}

export function formatInvestmentRange(value?: string | null) {
  return value || "Not captured";
}

const INR_COMPACT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatSipAmount(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not captured";
  return `${INR_COMPACT.format(value)} / month`;
}

export function formatDateDisplay(value?: string | null) {
  if (!value) return "Not captured";
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}

export function formatAgingDays(value?: number | null) {
  if (value === null || value === undefined) return "?";
  if (value <= 0) return "Today";
  if (value === 1) return "1 day";
  const months = Math.floor(value / 30);
  const days = value % 30;
  if (months >= 1) {
    const mPart = `${months} ${months === 1 ? "month" : "months"}`;
    const dPart = days > 0 ? ` ${days} ${days === 1 ? "day" : "days"}` : "";
    return mPart + dPart;
  }
  return `${value} days`;
}

/* --------------------------- Normalization -------------------------------- */

export function pickLeadStage(value?: string | null): LeadStage | undefined {
  if (!value) return undefined;
  if (value in STAGE_META) return value as LeadStage;
  return undefined;
}

export function pickLeadStatus<T extends string>(value?: string | null): T | undefined {
  if (!value) return undefined;
  return value.toUpperCase() as T;
}

/* -------------------------- Stage display UX ------------------------------ */

export type StageDisplay = {
  label: string;
  pillClass: string;
  state: "known" | "pending" | "revisit" | "custom";
  hint?: string;
};

/**
 * Resolve a user-friendly stage display (label, styling and quick state).
 *
 * - If `normalizedStage` maps to a known LeadStage in STAGE_META → "known"
 * - If nothing set yet (no stage/status) → "pending"
 * - If the value indicates dormancy/revisit (dormant stages or ON_HOLD) → "revisit"
 * - Otherwise use a generic, humanized label → "custom"
 */
export function resolveStageDisplay({
  rawStage,
  normalizedStage,
  status,
}: {
  rawStage?: string | null;
  normalizedStage?: LeadStage | string | null;
  status?: string | null;
}): StageDisplay {
  const rawTrimmed = rawStage?.toString().trim() || "";
  const norm = (normalizedStage ?? "").toString().trim() as string | "";
  const stageKeys = Object.keys(STAGE_META) as Array<keyof typeof STAGE_META>;

  // 1) Prefer normalized stage if it's a known key
  if (norm && stageKeys.includes(norm as any)) {
    const meta = STAGE_META[norm as keyof typeof STAGE_META];
    return {
      label: meta.label,
      pillClass: `${meta.pillClass} border border-transparent`,
      state: "known",
    };
  }

  // 2) Derive a value to consider from raw stage or status
  const stageOrStatus = (rawTrimmed || status || "").toString().trim();
  if (!stageOrStatus) {
    return {
      label: "Stage pending",
      pillClass:
        "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-50 border border-amber-200/60 dark:border-amber-400/30",
      state: "pending",
      hint: "Initial leads default to Pending. Update once the first interaction is complete.",
    };
  }

  const upper = stageOrStatus.toUpperCase();

  // 3) Revisit / dormant detection
  const dormantStages = new Set<string>([
    "NO_RESPONSE_DORMANT",
    "NOT_INTERESTED_DORMANT",
    "RISKY_CLIENT_DORMANT",
    "HIBERNATED",
    "REVISIT",
  ]);

  if (dormantStages.has(upper) || upper === "ON_HOLD") {
    return {
      label: upper === "REVISIT" ? "Revisit lead" : humanize(stageOrStatus),
      pillClass:
        "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200 border border-rose-200/60 dark:border-rose-400/40",
      state: "revisit",
      hint: "Marked for revisit. Review the last notes before the next touchpoint.",
    };
  }

  // 4) Pending-ish statuses
  if (upper === "PENDING" || upper === "ASSIGNED" || upper === "OPEN") {
    return {
      label: "Stage pending",
      pillClass:
        "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-50 border border-amber-200/60 dark:border-amber-400/30",
      state: "pending",
      hint: "Update once the first interaction is complete.",
    };
  }

  // 5) Custom / unknown - humanize and give neutral styling
  return {
    label: humanize(stageOrStatus),
    pillClass:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-100 border border-slate-200/60 dark:border-slate-500/40",
    state: "custom",
  };
}
