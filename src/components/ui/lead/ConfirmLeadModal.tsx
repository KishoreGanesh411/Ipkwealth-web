import { useState, type ReactNode } from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import Label from "../../form/Label";
import { validateLead, type LeadShape } from "./Validators";

import {
  genderOptions,
  professionOptions,
  productOptions,
  leadOptions,
  investmentOptions,
  valueToLabel,
  titleCaseWords,
} from "@/components/lead/types";

/* --------------------------- Local helpers/types --------------------------- */

type OptionalExtras = Partial<{
  clientType: string | string[] | null;
  clientTypes: string | string[] | null;
  leadSourceOther: string | null;
  referralName: string | null;
}>;

type ConfirmLeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadShape & OptionalExtras;
  onConfirm: () => Promise<void> | void; // call API in parent
};

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((v) => typeof v === "string");
}

function coalesceClientType(ctA: unknown, ctB: unknown): string {
  const v = ctA ?? ctB;
  if (typeof v === "string") return titleCaseWords(v);
  if (isStringArray(v)) return v.map((s) => titleCaseWords(s)).join(", ");
  return "";
}

/* --------------------------------- UI row --------------------------------- */

function Row({
  label,
  value,
  isBad = false,
}: {
  label: string;
  value?: ReactNode;
  isBad?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 items-start gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
      <div className="col-span-1">
        <Label className="text-xs">{label}</Label>
      </div>
      <div
        className={`col-span-2 text-sm ${
          isBad ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-white/90"
        }`}
      >
        {value || <span className="opacity-70">—</span>}
      </div>
    </div>
  );
}

/* ----------------------------- Success notice ----------------------------- */

function CenterNotice({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-green-700 shadow-xl dark:border-green-900/40 dark:bg-gray-900 dark:text-green-300">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}

/* --------------------------------- Modal ---------------------------------- */

export default function ConfirmLeadModal({
  isOpen,
  onClose,
  lead,
  onConfirm,
}: ConfirmLeadModalProps) {
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const vr = validateLead(lead);
  const hasIssues = !vr.ok;

  // ---- Humanized values for display only ----
  const firstName = titleCaseWords(lead.firstName ?? "");
  const lastName = titleCaseWords(lead.lastName ?? "");
  const phone = (lead.phone ?? "").trim();
  const email = (lead.email ?? "").trim();

  // leadSource: if "others", show the user-typed box
  const leadSource =
    lead.leadSource === "others"
      ? titleCaseWords(lead.leadSourceOther ?? "Others")
      : valueToLabel(lead.leadSource as string, leadOptions);

  const referral = titleCaseWords(lead.referralName ?? "");
  const remark = titleCaseWords(lead.remark ?? "");
  const assignedRmDisplay = lead.assignedRmName?.trim()
    ? lead.assignedRmName.trim()
    : "Unassigned";

  const gender = valueToLabel(lead.gender as string, genderOptions);
  const age = lead.age ? String(lead.age) : "";
  const profession = valueToLabel(lead.profession as string, professionOptions);

  const company = titleCaseWords(lead.companyName ?? "");
  const designation = titleCaseWords(lead.designation ?? "");
  const location = titleCaseWords(lead.location ?? "");
  const product = valueToLabel(lead.product as string, productOptions);
  const invRange = valueToLabel(lead.investmentRange as string, investmentOptions);
  const sipAmount = lead.sipAmount ? String(lead.sipAmount) : "";

  // clientType may be string or string[]
  const clientTypeDisplay = coalesceClientType(lead.clientType, lead.clientTypes);

  const needsCompany = lead.profession === "BUSINESS" || lead.profession === "EMPLOYEE";
  const isSelfEmployed = lead.profession === "SELF_EMPLOYED";

  async function handleConfirm() {
    try {
      setSaving(true);
      await onConfirm();
      setShowSuccess(true);
      // Auto-close after a short, pleasant delay
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[720px] m-4">
      <div className="relative w-full max-w-[720px] overflow-y-auto rounded-3xl bg-white p-5 dark:bg-gray-900 lg:p-8">
        {/* Header (simplified): removed the “red need attention” sentence */}
        <div className="px-1 pr-10">
          <h4 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Quick check before saving
          </h4>
        </div>

        {/* Details */}
        <div className="custom-scrollbar mt-2 max-h-[55vh] overflow-y-auto rounded-2xl border border-gray-100 dark:border-white/10">
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
            <div className="border-b border-gray-100 p-3 dark:border-white/10 sm:border-b-0 sm:border-r">
              <Row label="First Name" value={firstName} isBad={!lead.firstName?.trim()} />
              <Row label="Last Name" value={lastName} isBad={!lead.lastName?.trim()} />
              <Row label="Phone" value={phone} isBad={!lead.phone?.trim()} />
              <Row
                label="Email"
                value={email}
                isBad={!!lead.email && vr.invalid.includes("Email (invalid format)")}
              />
              <Row label="Lead Source" value={leadSource} isBad={!lead.leadSource?.trim()} />
              <Row label="Assigned RM" value={assignedRmDisplay} />
              {lead.leadSource === "referral" && (
                <Row
                  label="Referral / Lead Code"
                  value={referral}
                  isBad={!lead.referralName?.trim()}
                />
              )}
              <Row label="Remark" value={remark} />
            </div>

            <div className="p-3">
              <Row label="Gender" value={gender} />
              <Row label="Age" value={age} />
              <Row label="Profession" value={profession} />

              {/* BUSINESS / EMPLOYEE → company + designation */}
              {needsCompany && (
                <Row label="Company Name" value={company} isBad={!lead.companyName?.trim()} />
              )}
              {needsCompany && <Row label="Designation" value={designation} />}

              {/* SELF_EMPLOYED → designation required */}
              {isSelfEmployed && (
                <Row label="Designation" value={designation} isBad={!lead.designation?.trim()} />
              )}

              <Row label="Location" value={location} />
              <Row label="Product" value={product} />
              {lead.product === "IAP" && <Row label="Investment Range" value={invRange} />}
              {lead.product === "SIP" && <Row label="SIP Amount" value={sipAmount} />}
              <Row label="Client Type" value={clientTypeDisplay} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={hasIssues || saving}
            data-tooltip={hasIssues ? "Fix issues before confirming" : "Confirm & Save"}
          >
            {saving ? "Saving…" : "Confirm & Save"}
          </Button>
        </div>

        {/* Centered success notification */}
        {showSuccess && <CenterNotice message="Lead added to the table" />}
      </div>
    </Modal>
  );
}
