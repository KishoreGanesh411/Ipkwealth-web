export type Lead = {
  id: string | number;
  leadCode: string | null;
  name: string;
  leadSource: string;
  product: string;
  profession: string;
};

export type MyLeadsProps = {
  leads: Lead[];
};
