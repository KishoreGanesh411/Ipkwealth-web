export type LeadEventType =
  | "NOTE"
  | "CALL"
  | "MEETING"
  | "WHATSAPP"
  | "INTERACTION"
  | "STATUS_CHANGE"
  | "STAGE_CHANGE"
  | "ASSIGNMENT"
  | string;

export type TimelineEvent = {
  id: string;
  authorId?: string;
  type: LeadEventType;
  occurredAt: string;
  authorName?: string | null;
  note?: string | null;
  followUpOn?: string | null;
  prev?: any;
  next?: any;
  summary?: string | null;
};

export type EventFormState = {
  type: LeadEventType;
  note: string;
  followUpOn: string;
  channel?: string;
  outcome?: string;
  reactivateToStage?: string | null;
};
export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "OPEN", label: "Open" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "CLOSED", label: "Closed" },
];

export type StatustCardProps = {
  statusValue?: LeadStatus;
  stageValue?: LeadStage;
  onStatusChange: (value: string) => void;
  onStageChange: (value: string) => void;
  disabled?: boolean;
  saving?: boolean;
  onStatusStageChange?: (options: {
    newStatus?: string;
    newStage?: string;
    dormantReason?: string | null;
  }) => void | Promise<void>;
};

export type InteractionChannel =
  | "PHONE"
  | "MEETING"
  | "WHATSAPP"
  | "EMAIL"
  | string;

export type InteractionOutcome =
  | "ANSWERED"
  | "NO_ANSWER"
  | "INTERESTED"
  | "NOT_INTERESTED"
  | "FOLLOW_UP_NEEDED"
  | "WRONG_NUMBER"
  | string;

import type { LeadStage, LeadStatus } from "@/components/sales/myleads/interface/type";

/* ------------------------------- Phones ---------------------------------- */
export type LeadPhone = {
  id: string;
  label: "MOBILE" | "HOME" | "WORK" | string;
  number: string;
  normalized?: string | null;
  isPrimary: boolean;
  isWhatsapp: boolean;
  createdAt: string;
};

/* ------------------------------- Events ---------------------------------- */
export type LeadEvent = {
  id: string;
  type:
    | "REVISIT"
    | "NOTE"
    | "INTERACTION"
    | "STATUS_CHANGE"
    | "ASSIGNMENT"
    | "PHONE_ADDED"
    | "PHONE_REMOVED"
    | "PHONE_MARKED_PRIMARY"
    | "REMARK_UPDATED"
    | "BIO_UPDATED"
    | "HISTORY_SNAPSHOT";
  text?: string | null;
  tags?: string[] | null;
  occurredAt: string;
  prev?: unknown;
  next?: unknown;
  meta?: Record<string, unknown> | null;
};

export type AssignedRm = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type ClientQaItem = {
  question: string;
  answer: string;
};

/* ------------------------------- Lead ------------------------------------ */
export type LeadProfile = {
  id: string;
  leadCode?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  phoneNormalized?: string | null;
  mobile?: string | null;

  leadSource?: string | null;
  referralCode?: string | null;
  referralName?: string | null;

  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  age?: number | null;
  location?: string | null;
  // Legacy top-level occupation fields (kept for backward compat)
  profession?: "SELF_EMPLOYED" | "BUSINESS" | "EMPLOYEE" | string | null;
  companyName?: string | null;
  designation?: string | null;
  // New schema: occupations array
  occupations?: Array<{
    profession?: string | null;
    companyName?: string | null;
    designation?: string | null;
    startedAt?: string | null;
    endedAt?: string | null;
  }> | null;

  product?: "IAP" | "SIP" | string | null;
  investmentRange?: string | null;
  sipAmount?: number | null;

  status: LeadStatus | string;
  stageFilter?: string | null;
  clientStage?: LeadStage | string | null;
  clientStageRaw?: string | null;
  archived: boolean;

  remark?: string | null;
  remarks?: { text: string; author?: string | null; createdAt: string }[] | null;
  bioText?: string | null;
  clientTypes?: string | null;
  leadSourceOther?: string | null;

  clientQa?: ClientQaItem[] | null;

  createdAt: string;
  updatedAt: string;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  lastContactedAt?: string | null;
  approachAt?: string | null;
  reenterCount?: number | null;
  nextActionDueAt?: string | null;

  assignedRm?: AssignedRm | null;

  phones: LeadPhone[];
  events: LeadEvent[];
  history?: Array<{
    id: string;
    type?: string | null;
    text?: string | null;
    at?: string | null;
    authorId?: string | null;
    authorName?: string | null;
  } | null> | null;
};

export type LeadEditFormValues = Partial<LeadProfile>;
