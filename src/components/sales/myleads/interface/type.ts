export type Lead = {
  id: string | number;
  leadCode: string | null;
  name: string;
  email?: string | null;
  leadSource: string;
  gender?: "Male" | "Female" | "Other" | string;
};

export type MyLeadsProps = {
  leads?: Lead[];
  pageSize?: number;
};
