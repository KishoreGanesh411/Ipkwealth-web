export enum LeadStage {
  FIRST_TALK_DONE = 'FIRST_TALK_DONE',
  FOLLOWING_UP = 'FOLLOWING_UP',
  CLIENT_INTERESTED = 'CLIENT_INTERESTED',
  ACCOUNT_OPENED = 'ACCOUNT_OPENED',
  NO_RESPONSE_DORMANT = 'NO_RESPONSE_DORMANT',
  NOT_INTERESTED_DORMANT = 'NOT_INTERESTED_DORMANT',
  RISKY_CLIENT_DORMANT = 'RISKY_CLIENT_DORMANT',
  HIBERNATED = 'HIBERNATED',
}

export enum LeadStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  CLOSED = 'CLOSED',
  LOST = 'LOST',
}

export type ClientStatus = LeadStage;

export type Lead = {
  id: string | number;
  leadCode: string | null;
  name: string;
  email?: string | null;
  mobile?: string | null;
  location?: string | null;
  agingDays?: number;
  leadSource: string;
  status?: LeadStatus;
  clientStage?: LeadStage;
  gender?: 'Male' | 'Female' | 'Other' | string;
  product?: string;
  profession?: string;
  assignedAt?: string | null;
  lastContactedAt?: string | null;
  remark?: string | null;
  assignedRm?: string | null;
  isNew?: boolean;
};

export type MyLeadsProps = {
  leads?: Lead[];
  pageSize?: number;
  /** Show the built-in header (title + search). Defaults to true. */
  showHeader?: boolean;
  /** Optional external search query when using showHeader=false. */
  query?: string;
};
