import {
  Mail,
  PhoneCall,
  MapPin,
  UserRound,
  Package,
  CircleDollarSign,
  Briefcase,
  UserPlus,
  Clock,
  PencilLine,
} from "lucide-react";
import { formatInvestmentRange, formatRelative } from "./utils";
import type { EditableLeadField, LeadProfile } from "./types";

type Props = {
  lead: LeadProfile;
  loading: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  onEditField?: (field: EditableLeadField) => void; // optional - hook up when ready
};

export default function LeadMetaCard({ lead, loading, isAdmin, canEdit, onEditField }: Props) {
  const showReferral = (lead.leadSource ?? "").toLowerCase() === "referral";
  const referralValue =
    lead.referralName?.trim() || lead.referralCode?.trim() || "No referral provided";

  type Row = {
    key: string;
    icon: any;
    label: string;
    value: string;
    field?: EditableLeadField;
    editable?: boolean;
    visible?: boolean;
  };

  const rows: Row[] = [
    { key: "email", icon: Mail, label: "Email", value: lead.email ?? "No email", field: "email", editable: canEdit },
    {
      key: "phone",
      icon: PhoneCall,
      label: "Mobile number",
      value: lead.mobile ?? lead.phone ?? "No phone",
      field: "phone",
      editable: canEdit,
    },
    {
      key: "location",
      icon: MapPin,
      label: "Location",
      value: lead.location ?? "Location unknown",
      field: "location",
      editable: canEdit,
    },

    // Assigned RM -> admin only
    {
      key: "assignedRm",
      icon: UserRound,
      label: "Assigned RM",
      value: lead.assignedRmDetails?.name ?? lead.assignedRm ?? "Unassigned",
      field: "assignedRm",
      editable: isAdmin,
      visible: isAdmin,
    },

    { key: "product", icon: Package, label: "Product", value: lead.product?.trim() || "Not specified", field: "product", editable: canEdit },

    {
      key: "investmentRange",
      icon: CircleDollarSign,
      label: "Investment range",
      value: formatInvestmentRange(lead.investmentRange),
      field: "investmentRange",
      editable: canEdit,
      visible: !!lead.investmentRange || canEdit,
    },

    {
      key: "designation",
      icon: Briefcase,
      label: "Designation",
      value: lead.designation?.trim() || "Not provided",
      field: "designation",
      editable: canEdit,
      visible: !!lead.designation || canEdit,
    },

    {
      key: "referral",
      icon: UserPlus,
      label: "Referral person",
      value: referralValue,
      field: "referralName",
      editable: canEdit,
      visible: showReferral,
    },

    {
      key: "lastContact",
      icon: Clock,
      label: "Last contact",
      value: lead.lastContactedAt ? `Last contact ${formatRelative(lead.lastContactedAt)}` : "No contact logged",
    },
  ];

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {rows
        .filter((r) => r.visible !== false)
        .map(({ key, icon: Icon, label, value, field, editable }) => (
          <div
            key={key}
            className={`flex items-center gap-2 rounded-xl border border-gray-100 bg-white/70 px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 ${
              loading ? "opacity-70" : ""
            }`}
          >
            <Icon className="h-4 w-4 text-emerald-500" />
            <span className="truncate text-left text-sm font-medium" title={value}>
              {value}
            </span>

            {editable && field && (
              <button
                type="button"
                onClick={() => onEditField?.(field)}
                className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-gray-400 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-200 dark:text-white/40 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200"
                title={`Edit ${label.toLowerCase()}`}
              >
                <PencilLine className="h-4 w-4" />
                <span className="sr-only">Edit {label}</span>
              </button>
            )}
          </div>
        ))}
    </div>
  );
}
