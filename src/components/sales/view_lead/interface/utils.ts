import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { LeadStage } from "@/components/sales/myleads/interface/type";
import { STAGE_META } from "@/components/sales/myleads/stageMeta";

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function humanize(value?: string) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function formatEventTimestamp(value: string) {
  try {
    const date = parseISO(value);
    return `${format(date, "MMM d, yyyy 'at' h:mm a")} (${formatDistanceToNow(date, { addSuffix: true })})`;
  } catch {
    return value;
  }
}

export function formatRelative(value?: string | null) {
  if (!value) return "";
  try {
    const date = parseISO(value);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return value;
  }
}

export function formatInvestmentRange(value?: string | null) {
  if (!value) return "Not captured";
  return value;
}

const INR_COMPACT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatSipAmount(value?: number | null) {
  if (value === null || value === undefined) return "Not captured";
  if (!Number.isFinite(value)) return "Not captured";
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
  if (value === null || value === undefined) return "\u2014";
  if (value <= 0) return "Today";
  if (value === 1) return "1 day";
  return `${value} days`;
}

export function pickLeadStage(value?: string | null): LeadStage | undefined {
  if (!value) return undefined;
  if (value in STAGE_META) return value as LeadStage;
  return undefined;
}

export function pickLeadStatus<T extends string>(value?: string | null): T | undefined {
  if (!value) return undefined;
  return value.toUpperCase() as T;
}

export type StageDisplay = {
  label: string;
  pillClass: string;
  state: "known" | "pending" | "revisit" | "custom";
  hint?: string;
};

export function resolveStageDisplay({
  rawStage,
  normalizedStage,
  status,
}: {
  rawStage?: string | null;
  normalizedStage?: LeadStage | undefined;
  status?: string | null;
}): StageDisplay {
  const trimmedStage = rawStage?.toString().trim();
  if (normalizedStage) {
    const meta = STAGE_META[normalizedStage];
    return {
      label: meta.label,
      pillClass: `${meta.pillClass} border border-transparent`,
      state: "known",
    };
  }
  const stageOrStatus = trimmedStage || status?.trim();
  if (!stageOrStatus) {
    return {
      label: "Stage pending",
      pillClass: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-50 border border-amber-200/60 dark:border-amber-400/30",
      state: "pending",
      hint: "Initial leads default to Pending. Update once the first interaction is complete.",
    };
  }
  const upper = stageOrStatus.toUpperCase();
  if (upper === "PENDING" || upper === "ASSIGNED") {
    return {
      label: "Stage pending",
      pillClass: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-50 border border-amber-200/60 dark:border-amber-400/30",
      state: "pending",
      hint: "Initial leads default to Pending. Update once the first interaction is complete.",
    };
  }
  if (upper === "REVISIT") {
    return {
      label: "Revisit lead",
      pillClass: "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200 border border-rose-200/60 dark:border-rose-400/40",
      state: "revisit",
      hint: "Marked for revisit. Review the last notes before the next touchpoint.",
    };
  }
  return {
    label: humanize(stageOrStatus),
    pillClass: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-100 border border-slate-200/60 dark:border-slate-500/40",
    state: "custom",
  };
}
