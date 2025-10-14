// // Shared types used by the profile components

// import type { LeadStage, LeadStatus } from "@/components/sales/myleads/interface/type";

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

// export type EditableLeadField =
//   | "email"
//   | "phone"
//   | "location"
//   | "product"
//   | "investmentRange"
//   | "designation"
//   | "profession"
//   | "sipAmount"
//   | "referralName"
//   | "referralCode"
//   | "assignedRm";

// export type LeadProfile = {
//   id: string;
//   name: string;
//   firstName?: string | null;
//   lastName?: string | null;
//   leadCode?: string | null;
//   email?: string | null;
//   phone?: string | null;
//   mobile?: string | null;
//   phones?: {
//     number: string;
//     isWhatsapp: boolean;
//     isPrimary?: boolean;
//   }[];
//   location?: string | null;
//   leadSource?: string | null;
//   product?: string | null;
//   investmentRange?: string | null;
//   designation?: string | null;
//   profession?: string | null;
//   companyName?: string | null;
//   referralName?: string | null;
//   referralCode?: string | null;
//   status?: LeadStatus | string;
//   clientStage?: LeadStage | string | null;
//   clientStageRaw?: string | null;
//   clientTypes?: string | null;
//   sipAmount?: number | null;
//   gender?: string | null;
//   enteredAt?: string | null;
//   agingDays?: number | null;
//   remark?: string | null;
//   assignedRm?: string | null;
//   assignedRmDetails?: {
//     id: string;
//     name: string;
//     email?: string | null;
//     phone?: string | null;
//   } | null;
//   createdAt?: string | null;
//   updatedAt?: string | null;
//   lastContactedAt?: string | null;
//   revisitCount?: number;
// };

// export type LeadEditFormValues = {
//   leadCode?: string | null;
//   leadSource?: string | null;
//   firstName: string;
//   lastName: string;
//   fullName: string;
//   email: string;
//   phone: string;
//   location: string;
//   profession: string;
//   designation: string;
//   companyName: string;
//   product: string;
//   investmentRange: string;
//   sipAmount: string;
//   clientTypes: string;
//   gender: string;
//   remark: string;
// };

export type TimelineEvent = {
  id: string;
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

  leadSource?: string | null;
  referralCode?: string | null;

  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  age?: number | null;
  location?: string | null;
  profession?: "SELF_EMPLOYED" | "BUSINESS" | "EMPLOYEE" | string | null;
  companyName?: string | null;
  designation?: string | null;

  product?: "IAP" | "SIP" | string | null;
  investmentRange?: string | null;
  sipAmount?: number | null;

  status: LeadStatus | string;
  clientStage?: LeadStage | string | null;
  archived: boolean;

  remark?: string | null;
  bioText?: string | null;
  clientTypes?: string | null;

  clientQa?: ClientQaItem[] | null;

  createdAt: string;
  updatedAt: string;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  approachAt?: string | null;
  reenterCount?: number | null;

  assignedRm?: AssignedRm | null;

  phones: LeadPhone[];
  events: LeadEvent[];
};

export type LeadEditFormValues = Partial<LeadProfile>;
