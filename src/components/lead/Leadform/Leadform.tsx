// src/components/lead/Leadform/Leadform.tsx
import React, { useMemo } from "react";
import { UserIcon, EnvelopeIcon, MailIcon, TaskIcon } from "../../../icons";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { leadOptions, type LeadSource, type LeadFormData } from "../../../components/lead/types";

/** Local state type for this step (extends LeadFormData with the fields we use) */
export type LeadFormState = Pick<
  LeadFormData,
  "firstName" | "lastName" | "email" | "phone" | "remark"
> & {
  leadSource: LeadSource | "";
  leadSourceOther?: string;
  // referral capture when source=referral
  referralMode?: "NAME" | "LEAD_CODE"; // UI toggle between name/code
  referralName?: string; // optional
  referralCode?: string; // optional
  // assignment
  assignMode?: "AUTO" | "MANUAL";
  assignedRmId?: string;
  assignedRmName?: string;
};

interface CreateLeadFormProps {
  lead: LeadFormState & Record<string, any>;
  setLead: React.Dispatch<React.SetStateAction<LeadFormState & Record<string, any>>>;
  phoneOk: boolean;
  /** Optional; if omitted we'll infer from lead.leadSource */
  isReferral?: boolean;
  canAssignRm?: boolean;
  rmOptions?: ReadonlyArray<{ value: string; label: string }>;
  rmLoading?: boolean;
}

const IconWrap = ({ children }: { children: React.ReactNode }) => (
  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-white/50">
    {children}
  </span>
);

export default function CreateLeadForm({
  lead,
  setLead,
  phoneOk,
  isReferral,
  canAssignRm,
  rmOptions,
  rmLoading,
}: CreateLeadFormProps) {
  const isOtherSource = lead.leadSource === "others";
  const showReferral = isReferral ?? lead.leadSource === "referral";
  const showAssignRm = Boolean(canAssignRm);
  const autoAssignValue = "__AUTO_ASSIGN__";
  const rmSelectOptions = useMemo(() => {
    const base = rmOptions ?? [];
    const deduped: ReadonlyArray<{ value: string; label: string }> = base;
    const extras: { value: string; label: string }[] = [];
    if (lead.assignedRmId && lead.assignedRmName) {
      const alreadyPresent = deduped.some((opt) => opt.value === lead.assignedRmId);
      if (!alreadyPresent) {
        extras.push({ value: lead.assignedRmId, label: lead.assignedRmName });
      }
    }
    return [
      // manual-only dropdown options
      ...deduped,
      ...extras,
    ];
  }, [rmOptions, lead.assignedRmId, lead.assignedRmName]);

  return (
    <div className="space-y-4">
      {/* First and Last Name */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>
            First Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <IconWrap>
              <UserIcon className="h-4 w-4" />
            </IconWrap>
            <Input
              className="pl-9"
              value={lead.firstName}
              onChange={(e) => setLead((s) => ({ ...s, firstName: e.target.value }))}
              placeholder="Enter first name"
            />
          </div>
        </div>

        <div>
          <Label>
            Last Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <IconWrap>
              <UserIcon className="h-4 w-4" />
            </IconWrap>
            <Input
              className="pl-9"
              value={lead.lastName}
              onChange={(e) => setLead((s) => ({ ...s, lastName: e.target.value }))}
              placeholder="Enter last name"
            />
          </div>
        </div>
      </div>

      {/* Email (optional) */}
      <div>
        <Label>Email</Label>
        <div className="relative">
          <IconWrap>
            <EnvelopeIcon className="h-4 w-4" />
          </IconWrap>
          <Input
            className="pl-9"
            type="email"
            value={lead.email ?? ""}
            onChange={(e) => setLead((s) => ({ ...s, email: e.target.value }))}
            placeholder="info@gmail.com"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <Label>
          Phone <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <IconWrap>
            <MailIcon className="h-4 w-4" />
          </IconWrap>
          <Input
            className="pl-9"
            type="tel"
            value={lead.phone}
            onChange={(e) => setLead((s) => ({ ...s, phone: e.target.value }))}
            placeholder="Enter phone number"
            aria-invalid={!phoneOk}
          />
        </div>
        {!phoneOk && (
          <p className="mt-1 text-xs text-red-500">Enter a valid phone number</p>
        )}
      </div>

      {/* Lead Source */}
      <div>
        <Label>
          Lead Source <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <IconWrap>
            <TaskIcon className="h-4 w-4" />
          </IconWrap>
          <Select
            className="pl-9"
            options={leadOptions} // ReadonlyArray is OK if your Select accepts it
            placeholder="Select lead source"
            value={lead.leadSource}
            onChange={(val: string) =>
              setLead((s) => ({
                ...s,
                leadSource: val as LeadSource,
                // clear fields when switching away
                referralName: val === "referral" ? s.referralName ?? "" : "",
                referralCode: val === "referral" ? s.referralCode ?? "" : "",
                referralMode: val === "referral" ? (s.referralMode ?? "NAME") : s.referralMode,
                leadSourceOther: val === "others" ? s.leadSourceOther ?? "" : "",
              }))
            }
          />
        </div>

        {/* Text box when "others" */}
        {isOtherSource && (
          <div className="mt-2">
            <Input
              className="pl-3"
              value={lead.leadSourceOther ?? ""}
              onChange={(e) =>
                setLead((s) => ({ ...s, leadSourceOther: e.target.value }))
              }
              placeholder="Type the other source (e.g., WhatsApp, Walk-in, Instagram DM)"
            />
            <p className="mt-1 text-xs text-gray-500">
              This text will be saved as <span className="font-medium">Lead Source</span>.
            </p>
          </div>
        )}
      </div>

      {showAssignRm && (
        <div>
          <Label>Assign RM</Label>
          <div className="mt-1 flex items-center gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
              <input
                type="radio"
                name="assignMode"
                className="h-4 w-4 accent-blue-600"
                checked={(lead.assignMode ?? "AUTO") === "AUTO"}
                onChange={() =>
                  setLead((s) => ({ ...s, assignMode: "AUTO", assignedRmId: undefined, assignedRmName: undefined }))
                }
              />
              Auto assign
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
              <input
                type="radio"
                name="assignMode"
                className="h-4 w-4 accent-blue-600"
                checked={(lead.assignMode ?? "AUTO") === "MANUAL"}
                onChange={() => setLead((s) => ({ ...s, assignMode: "MANUAL" }))}
              />
              Manual assign
            </label>
          </div>
          <Select
            className="pl-3"
            options={rmSelectOptions}
            style={{ display: (lead.assignMode ?? "AUTO") === "MANUAL" ? "block" : "none" }}
            value={(lead.assignMode ?? "AUTO") === "MANUAL" ? (lead.assignedRmId ?? "") : ""}
            onChange={(val: string) => {
              if (val === autoAssignValue) {
                setLead((s) => ({ ...s, assignedRmId: undefined, assignedRmName: undefined }));
                return;
              }
              const selected = rmSelectOptions.find((opt) => opt.value === val);
              setLead((s) => ({
                ...s,
                assignedRmId: val,
                assignedRmName: selected?.label ?? "",
              }));
            }}
            placeholder={rmLoading ? "Loading..." : "Select RM"}
            disabled={rmLoading || rmSelectOptions.length <= 1}
          />
          {(lead.assignMode ?? "AUTO") === "MANUAL" && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Only active RM users are shown.</p>
          )}
        </div>
      )}

      {/* Referral Name / Lead Code */}
      {showReferral && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Referral</Label>
            <div className="flex gap-2">
              {(["NAME", "LEAD_CODE"] as const).map((mode) => {
                const active = (lead.referralMode ?? "NAME") === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLead((s) => ({ ...s, referralMode: mode }))}
                    className={
                      `rounded-full px-3 py-1 text-xs font-semibold transition ` +
                      (active
                        ? "bg-emerald-500 text-white"
                        : "border border-gray-200 text-gray-700 hover:border-emerald-300 dark:border-white/10 dark:text-gray-200")
                    }
                    aria-pressed={active}
                  >
                    {mode === "NAME" ? "Lead name" : "Lead code"}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="relative">
            <IconWrap>
              <UserIcon className="h-4 w-4" />
            </IconWrap>
            {((lead.referralMode ?? "NAME") === "NAME") ? (
              <Input
                className="pl-9"
                value={lead.referralName ?? ""}
                onChange={(e) =>
                  setLead((s) => ({ ...s, referralName: e.target.value }))
                }
                placeholder="Enter referral name"
              />
            ) : (
              <Input
                className="pl-9"
                value={lead.referralCode ?? ""}
                onChange={(e) =>
                  setLead((s) => ({ ...s, referralCode: e.target.value }))
                }
                placeholder="Enter referral lead code (e.g., IPK25100002)"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}


