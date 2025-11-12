export enum LeadStage {
  NEW_LEAD = 'NEW_LEAD',
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

// New Stage Filter classification (separate from pipeline stage)
export enum LeadStageFilter {
  FUTURE_INTERESTED = 'FUTURE_INTERESTED',
  HIGH_PRIORITY = 'HIGH_PRIORITY',
  LOW_PRIORITY = 'LOW_PRIORITY',
  NEED_CLARIFICATION = 'NEED_CLARIFICATION',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
  NOT_INTERESTED = 'NOT_INTERESTED',
  ON_PROCESS = 'ON_PROCESS',
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
  // Status column in Sales pages shows the Stage Filter when available
  status?: LeadStage | LeadStatus | LeadStageFilter | string | null;
  clientStage?: LeadStage;
  stageFilter?: LeadStageFilter | string | null;
  gender?: 'Male' | 'Female' | 'Other' | string;
  product?: string;
  profession?: string;
  assignedAt?: string | null;
  lastContactedAt?: string | null;
  /** next scheduled follow-up timestamp (ISO) */
  nextActionDueAt?: string | null;
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

