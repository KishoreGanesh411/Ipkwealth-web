// Shared types used by the profile components

import type { LeadStage, LeadStatus } from "@/components/sales/myleads/interface/type";

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

export type EditableLeadField =
  | "email"
  | "phone"
  | "location"
  | "product"
  | "investmentRange"
  | "designation"
  | "referralName"
  | "referralCode"
  | "assignedRm";

export type LeadProfile = {
  id: string;
  name: string;
  leadCode?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  location?: string | null;
  leadSource?: string | null;
  product?: string | null;
  investmentRange?: string | null;
  designation?: string | null;
  referralName?: string | null;
  referralCode?: string | null;
  status?: LeadStatus;
  clientStage?: LeadStage;
  remark?: string | null;
  assignedRm?: string | null;
  assignedRmDetails?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastContactedAt?: string | null;
};

export type TimelineEvent = {
  id: string;
  type: LeadEventType;
  occurredAt: string;
  note?: string | null;
  summary?: string | null;
  followUpOn?: string | null;
  authorName?: string | null;
  authorInitials?: string | null;
  prevStatus?: string | null;
  nextStatus?: string | null;
  prevStage?: string | null;
  nextStage?: string | null;
};

export type EventFormState = {
  type: LeadEventType;
  note: string;
  followUpOn: string;
};
