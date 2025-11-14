// src/components/sales/view_lead/autoStatus.ts

/**
 * Tiny helper to keep the "auto-open after first talk" rule
 * in one place. We treat the lead as ready to open when:
 *  - previous pipeline status is in an initial state
 *    (PENDING / ASSIGNED, case-insensitive)
 *  - the new pipeline stage is FIRST_TALK_DONE
 */
export function shouldAutoOpenLead(params: {
  previousStatus?: string | null;
  nextStage?: string | null;
}): boolean {
  const status = (params.previousStatus ?? "").toString().trim().toUpperCase();
  const stage = (params.nextStage ?? "").toString().trim().toUpperCase();
  if (!status || !stage) return false;
  const isInitialStatus = status === "PENDING" || status === "ASSIGNED";
  return isInitialStatus && stage === "FIRST_TALK_DONE";
}
