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

export function pickLeadStage(value?: string | null): LeadStage | undefined {
  if (!value) return undefined;
  if (value in STAGE_META) return value as LeadStage;
  return undefined;
}

// status options are strings (enum values). Keep a safe helper:
export function pickLeadStatus<T extends string>(value?: string | null): T | undefined {
  if (!value) return undefined;
  return value.toUpperCase() as T;
}
