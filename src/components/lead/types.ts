
/** ---------- Step 1 (Create Lead) ---------- */
export interface LeadFormData {
  firstName: string;
  lastName: string;
  email?: string;               // was string → optional fits your UI
  phone: string;
  leadSource: string;           // narrowed below via LeadSource if you want
  assignedRmId?: string;        // optional manual assignment by admin users
  assignedRmName?: string;      // cached label for confirmation modal/UI
  /** When leadSource === "others" */
  leadSourceOther?: string;
  /** When leadSource === "referral" */
  referralName?: string;
  /** Kept for back-compat if some places still use this name */
  referralCode?: string;
  remark?: string;
  approachAt?: Date | string; // Apollo will serialize Date → ISO automatically
  clientQa?: Array<{ question: string; answer: string }>;
}

export interface Lead {
  id: string;
  leadCode: string;

  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  leadSource: string;
  remark?: string;

  assignedRM?: string | null;
  assignedRmId?: string | null;

  createdAt: string;
  updatedAt: string;

  gender?: "MALE" | "FEMALE" | "OTHER";
  age?: number | "";
  profession?: "SELF_EMPLOYED" | "BUSINESS" | "EMPLOYEE" | "";
  companyName?: string;
  designation?: string;
  location?: string;

  product?: "IAP" | "SIP" | "";
  investmentRange?: "" | "<5L" | "10-25L" | "50L+";
  sipAmount?: number | "";

  clientTypes?:
  | Array<"Interested" | "Enquiry" | "Important">
  | "Interested"
  | "Enquiry"
  | "Important";

  selected?: boolean;
}

/** (If you still need it elsewhere) */
export type LeadDataRef = {
  addLead: (data: LeadFormData) => void;
};

/** ---------- Select options ---------- */
export const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

export const professionOptions = [
  { value: "SELF_EMPLOYED", label: "Self Employed" },
  { value: "BUSINESS", label: "Business" },
  { value: "EMPLOYEE", label: "Employee" },
] as const;

export const productOptions = [
  { value: "IAP", label: "IAP" },
  { value: "SIP", label: "SIP" },
] as const;

export const clientTypeOptions = ["Interested", "Enquiry", "Important"] as const;

export const leadOptions = [
  { value: "meta", label: "Meta" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "others", label: "Others" },
] as const;

/** Narrowed union from leadOptions */
export type LeadSource = (typeof leadOptions)[number]["value"];

export const investmentOptions = [
  { value: "<5L", label: "< 5 Lakhs" },
  { value: "10-25L", label: "10–25 Lakhs" },
  { value: "50L+", label: "50 Lakhs +" },
] as const;

/** ---------- Helpers ---------- */
export function titleCaseWords(input: string): string {
  return input
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function humanizeEnum(input?: string | null): string {
  if (!input) return "—";
  return titleCaseWords(String(input).replace(/_/g, " "));
}

type Opt = ReadonlyArray<{ value: string; label: string }>;
export function valueToLabel(
  val: string | undefined,
  opts: Opt,
  fallbackToTitle = true
): string {
  if (!val) return "—";
  const hit = opts.find((o) => o.value === val);
  if (hit) return hit.label;
  return fallbackToTitle ? titleCaseWords(val) : val;
}
