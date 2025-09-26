export type ClientStatus =
  | "FIRST_TALK_DONE"
  | "FOLLOWING_UP"
  | "CLIENT_INTERESTED"
  | "ACCOUNT_OPENED"
  | "NO_RESPONSE_DORMANT"
  | "NOT_INTERESTED_DORMANT"
  | "RISKY_CLIENT_DORMANT"
  | "HIBERNATED";

export type Lead = {
  id: string | number;
  leadCode: string | null;
  name: string;
  email?: string | null;
  mobile?: string | null;
  location?: string | null;
  agingDays?: number;
  leadSource: string;
  status?: ClientStatus;
  gender?: "Male" | "Female" | "Other" | string;
  product?: string;
  profession?: string;
};

export type MyLeadsProps = {
  leads?: Lead[];
  pageSize?: number;
};
