export type LeadShape = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // lead source + conditional "other" text
  leadSource: string;          // e.g. "meta" | "youtube" | "referral" | "others" | ...
  leadSourceOther?: string;    // used only when leadSource === "others"

  referralName?: string;
  referralCode?: string;       // optional when capturing by code
  referralMode?: "NAME" | "LEAD_CODE";
  gender?: string;
  age?: number | "";
  profession?: string;         // "SELF_EMPLOYED" | "BUSINESS" | "EMPLOYEE" | ...
  companyName?: string;        // used for BUSINESS/EMPLOYEE flow
  designation?: string;        // required for SELF_EMPLOYED (as per requirement)
  location?: string;
  product?: string;
  investmentRange?: string;
  sipAmount?: number | "";
  clientType?: string;
  remark?: string;
  assignedRmId?: string;
  assignedRmName?: string;
};

export type ValidationResult = {
  ok: boolean;
  missing: string[];
  invalid: string[];
};

const PHONE_OK = (val: string) => /^[0-9+\-\s()]{8,}$/.test(val.trim());
const EMAIL_OK = (val: string) =>
  !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()); // email is optional

export function validateLead(lead: LeadShape): ValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];

  if (!lead.firstName?.trim()) missing.push("First Name");
  if (!lead.lastName?.trim()) missing.push("Last Name");
  if (!lead.phone?.trim()) missing.push("Phone");
  if (!lead.leadSource?.trim()) missing.push("Lead Source");

  if (lead.phone && !PHONE_OK(lead.phone)) invalid.push("Phone (invalid format)");
  if (!EMAIL_OK(lead.email)) invalid.push("Email (invalid format)");

  // Referral: require according to the selected mode (default NAME)
  if (lead.leadSource === "referral") {
    const mode = lead.referralMode ?? "NAME";
    const hasName = !!lead.referralName?.trim();
    const hasCode = !!lead.referralCode?.trim();
    const ok = mode === "LEAD_CODE" ? hasCode : hasName;
    if (!ok) missing.push("Referral (name or code)");
  }

  // NEW: when "others", require the text box
  if (lead.leadSource === "others" && !lead.leadSourceOther?.trim()) {
    missing.push("Other Lead Source");
  }

  // NEW: when self-employed, require designation (no company needed)
  if (lead.profession === "SELF_EMPLOYED" && !lead.designation?.trim()) {
    missing.push("Designation");
  }

  // Keep old rule for BUSINESS/EMPLOYEE
  if (
    (lead.profession === "BUSINESS" || lead.profession === "EMPLOYEE") &&
    !lead.companyName?.trim()
  ) {
    missing.push("Company Name");
  }

  return { ok: missing.length === 0 && invalid.length === 0, missing, invalid };
}
