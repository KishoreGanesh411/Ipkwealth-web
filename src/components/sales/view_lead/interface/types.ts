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
  | "profession"
  | "sipAmount"
  | "referralName"
  | "referralCode"
  | "assignedRm";

export type LeadProfile = {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  leadCode?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  phones?: {
    number: string;
    isWhatsapp: boolean;
    isPrimary?: boolean;
  }[];
  location?: string | null;
  leadSource?: string | null;
  product?: string | null;
  investmentRange?: string | null;
  designation?: string | null;
  profession?: string | null;
  companyName?: string | null;
  referralName?: string | null;
  referralCode?: string | null;
  status?: LeadStatus | string;
  clientStage?: LeadStage | string | null;
  clientStageRaw?: string | null;
  clientTypes?: string | null;
  sipAmount?: number | null;
  gender?: string | null;
  enteredAt?: string | null;
  agingDays?: number | null;
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
  revisitCount?: number;
};

export type LeadEditFormValues = {
  leadCode?: string | null;
  leadSource?: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  profession: string;
  designation: string;
  companyName: string;
  product: string;
  investmentRange: string;
  sipAmount: string;
  clientTypes: string;
  gender: string;
  remark: string;
};

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
};
