import { LeadShape } from "@/components/ui/lead/Validators";

export type OptionalExtras = Partial<{
  leadSourceOther: string | null;
  referralName: string | null;
  assignedRM: string | null;
  age: number | null;
  referralCode: string | null;
  bioText: string | null;
}>;

export type LeadEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initial?: LeadEditModalValues;
};
export type LeadEditModalValues = Partial<LeadShape & OptionalExtras> & {
  fullName?: string;
  primaryPhone?: string;
  whatsappPhone?: string;
};
