// src/components/lead/Leadform/Leadform.tsx
import React from "react";
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
  leadSource: LeadSource;
  leadSourceOther?: string;
  referralName?: string; // using this name in the UI
};

interface CreateLeadFormProps {
  lead: LeadFormState;
  setLead: React.Dispatch<React.SetStateAction<LeadFormState>>;
  phoneOk: boolean;
  /** Optional; if omitted we'll infer from lead.leadSource */
  isReferral?: boolean;
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
}: CreateLeadFormProps) {
  const isOtherSource = lead.leadSource === "others";
  const showReferral = isReferral ?? lead.leadSource === "referral";

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

      {/* Referral Name / Lead Code */}
      {showReferral && (
        <div>
          <Label>Referral Name / Lead Code</Label>
          <div className="relative">
            <IconWrap>
              <UserIcon className="h-4 w-4" />
            </IconWrap>
            <Input
              className="pl-9"
              value={lead.referralName ?? ""}
              onChange={(e) =>
                setLead((s) => ({ ...s, referralName: e.target.value }))
              }
              placeholder="Enter referral name or lead code"
            />
          </div>
        </div>
      )}
    </div>
  );
}
