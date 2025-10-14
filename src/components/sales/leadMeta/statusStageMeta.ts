import { STAGE_META as BASE_STAGE_META } from "@/components/sales/myleads/stageMeta";
import type { LeadStage, LeadStatus } from "@/components/sales/myleads/interface/type";

// Centralised status options used across StatusCard, filters and dropdowns
export const STATUS_OPTIONS: Array<{ value: LeadStatus | string; label: string }> = [
  { value: "PENDING", label: "Pending" },
  { value: "OPEN", label: "Open" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "CLOSED", label: "Closed" },
];

// Re-export stage meta from MyLeads to keep a single source of truth
export const STAGE_META = BASE_STAGE_META as Record<
  LeadStage | string,
  { label: string; pillClass: string; barClass: string }
>;

// Helper: list of dormant stages (used for prompts/reason selection)
export const DORMANT_STAGE_KEYS: ReadonlyArray<LeadStage | string> = [
  "NO_RESPONSE_DORMANT",
  "NOT_INTERESTED_DORMANT",
  "RISKY_CLIENT_DORMANT",
  "HIBERNATED",
];

export function isDormantStage(stage?: string | null): boolean {
  if (!stage) return false;
  return DORMANT_STAGE_KEYS.includes(String(stage).toUpperCase());
}

// Suggested list of dormant reasons. Kept generic so the server can map/validate.
export const DORMANT_REASONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "NO_RESPONSE", label: "No response" },
  { value: "NOT_INTERESTED", label: "Not interested" },
  { value: "WRONG_CONTACT", label: "Wrong contact" },
  { value: "BUDGET_CONSTRAINT", label: "Budget constraint" },
  { value: "RISK_PROFILE_MISMATCH", label: "Risk profile mismatch" },
  { value: "COMPLIANCE_HOLD", label: "Compliance hold" },
  { value: "OTHER", label: "Other" },
];

// Convenience options for stage dropdowns
export const STAGE_SELECT_OPTIONS = Object.entries(STAGE_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

