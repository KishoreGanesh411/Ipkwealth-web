import {
  Building,
  Building2,
  CircleDollarSign,
  Clock,
  Flag,
  Mail,
  MapPin,
  Package,
  PencilLine,
  PhoneCall,
  Briefcase,
  UserPlus,
  UserRound,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  formatInvestmentRange,
  formatRelative,
  formatSipAmount,
  resolveStageDisplay,
  humanize,
} from "./interface/utils";
import type { LeadProfile } from "./interface/types";

// Local field keys that can be edited via the inline editor
type EditableLeadField =
  | keyof LeadProfile
  | "referralName"
  | "referralCode"
  | "sipAmount"
  | "investmentRange"
  | "profession"
  | "designation";

type Props = {
  lead: LeadProfile;
  loading: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  onEditField?: (field: EditableLeadField) => void;
};

type Row = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
  field?: EditableLeadField;
  editable?: boolean;
  visible?: boolean;
  href?: string;
  secondary?: string | null;
  emphasis?: "pill" | "default";
  accentClass?: string;
  hint?: string;
  hintClass?: string;
  muted?: boolean;
};

export default function LeadMetaCard({ lead, loading, isAdmin, canEdit, onEditField }: Props) {
  const stageInfo = resolveStageDisplay({
    rawStage: lead.clientStageRaw,
    normalizedStage: lead.clientStage,
    status: lead.status,
  });

  const stageHintClass =
    stageInfo.state === "pending"
      ? "text-amber-600 dark:text-amber-200"
      : stageInfo.state === "revisit"
      ? "text-rose-600 dark:text-rose-200"
      : "text-gray-500 dark:text-white/60";

  const profession = lead.profession?.trim() || "";
  const designation = lead.designation?.trim() || "";
  const company = lead.companyName?.trim() || "";
  const occupationPrimary = profession || designation || company;
  const occupationKey = occupationPrimary ? occupationPrimary.toLowerCase() : "";
  const occupationSecondaryParts: string[] = [];
  if (designation && designation.toLowerCase() !== occupationKey) {
    occupationSecondaryParts.push(designation);
  }
  if (company && company.toLowerCase() !== occupationKey) {
    occupationSecondaryParts.push(company);
  }
  const occupationSecondary =
    occupationSecondaryParts.length > 0 ? occupationSecondaryParts.join(" | ") : null;

  const genderRaw = lead.gender?.trim() || "";
  const genderDisplay = genderRaw ? humanize(genderRaw) : "Unknown";

  const location = lead.location?.trim() || "";
  const product = lead.product?.trim() || "";

  const referralName = lead.referralName?.trim() || "";
  const referralCode = lead.referralCode?.trim() || "";
  const hasReferral = Boolean(referralName || referralCode);
  const referralValue = hasReferral ? referralName || referralCode : "No referral provided";
  const referralSecondary = referralName && referralCode ? `Code: ${referralCode}` : undefined;
  const showReferral = hasReferral;

  const hasInvestmentRange = !!lead.investmentRange?.trim();
  const hasSipAmount = lead.sipAmount !== null && lead.sipAmount !== undefined;
  const investmentPrimary = hasInvestmentRange
    ? formatInvestmentRange(lead.investmentRange)
    : hasSipAmount
    ? formatSipAmount(lead.sipAmount)
    : "Not captured";

  const investmentSecondary =
    hasInvestmentRange && hasSipAmount ? formatSipAmount(lead.sipAmount) : undefined;

  const investmentLabel =
    hasInvestmentRange && hasSipAmount
      ? "Investment & SIP"
      : hasInvestmentRange
      ? "Investment range"
      : hasSipAmount
      ? "SIP amount"
      : "Investment details";

  const rows: Row[] = [
    {
      key: "clientStage",
      icon: Flag,
      label: "Client stage",
      value: stageInfo.label,
      emphasis: "pill",
      accentClass: stageInfo.pillClass,
      hint: stageInfo.hint,
      hintClass: stageHintClass,
    },
    {
      key: "email",
      icon: Mail,
      label: "Email",
      value: lead.email ?? "No email",
      field: "email",
      editable: canEdit,
      href: lead.email ? `mailto:${lead.email}` : undefined,
      muted: !lead.email,
    },
    {
      key: "phone",
      icon: PhoneCall,
      label: "Mobile number",
      value: lead.mobile ?? lead.phone ?? "No phone",
      field: "phone",
      editable: canEdit,
      href:
        lead.mobile || lead.phone
          ? `tel:${(lead.mobile ?? lead.phone ?? "").replace(/\s+/g, "")}`
          : undefined,
      muted: !(lead.mobile || lead.phone),
    },
    {
      key: "location",
      icon: MapPin,
      label: "Location",
      value: location || "Location unknown",
      field: "location",
      editable: canEdit,
      muted: !location,
    },
    {
      key: "assignedRm",
      icon: UserRound,
      label: "Assigned RM",
      value: (lead as any).assignedRmDetails?.name ?? (lead as any).assignedRm?.name ?? (lead as any).assignedRm ?? "Unassigned",
      field: "assignedRm",
      editable: isAdmin,
      visible: isAdmin,
      muted: !((lead as any).assignedRmDetails?.name ?? (lead as any).assignedRm?.name ?? (lead as any).assignedRm),
    },
    {
      key: "occupation",
      icon: Briefcase,
      label: "Occupation",
      value: occupationPrimary || "Not captured",
      secondary: occupationSecondary,
      field: profession ? "profession" : designation ? "designation" : undefined,
      editable: canEdit,
      visible: Boolean(occupationPrimary || occupationSecondary || canEdit),
      muted: !(occupationPrimary || occupationSecondary),
    },
    {
      key: "product",
      icon: Package,
      label: "Product",
      value: product || "Not specified",
      field: "product",
      editable: canEdit,
      muted: !product,
    },
    {
      key: "gender",
      icon: User,
      label: "Gender",
      value: genderDisplay,
      muted: !genderRaw,
    },
    {
      key: "company",
      icon: Building,
      label: "Company",
      value: company || "Not captured",
      secondary: designation && designation.toLowerCase() !== occupationKey ? designation : null,
      visible: Boolean(company || designation || canEdit),
      muted: !(company || designation),
    },
    {
      key: "investmentRange",
      icon: CircleDollarSign,
      label: investmentLabel,
      value: investmentPrimary,
      secondary: investmentSecondary,
      field: hasInvestmentRange ? "investmentRange" : hasSipAmount ? "sipAmount" : undefined,
      editable: canEdit,
      visible: hasInvestmentRange || hasSipAmount || canEdit,
      muted: !(hasInvestmentRange || hasSipAmount),
    },
    {
      key: "clientTypes",
      icon: Building2,
      label: "Client type",
      value: lead.clientTypes?.trim() || "Not categorised",
      visible: !!lead.clientTypes,
      muted: !lead.clientTypes,
    },
    {
      key: "referral",
      icon: UserPlus,
      label: "Referral",
      value: referralValue,
      secondary: referralSecondary ?? null,
      field: referralName ? "referralName" : referralCode ? "referralCode" : undefined,
      editable: canEdit,
      visible: showReferral,
      muted: !hasReferral,
    },
    {
      key: "lastContact",
      icon: Clock,
      label: "Last contact",
      value: lead.lastContactedAt
        ? `Last contact ${formatRelative(lead.lastContactedAt)}`
        : "No contact logged",
      muted: !lead.lastContactedAt,
    },
  ];

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {rows
        .filter((row) => row.visible !== false)
        .map(
          ({
            key,
            icon: Icon,
            label,
            value,
            field,
            editable,
            href,
            secondary,
            emphasis,
            accentClass,
            hint,
            hintClass,
            muted,
          }) => (
            <div
              key={key}
              className={`group relative flex items-start gap-3 rounded-2xl border border-gray-100 bg-white/80 px-4 py-4 text-sm text-gray-700 shadow-sm transition hover:-translate-y-[1px] hover:border-emerald-200 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70 ${
                loading ? "opacity-60" : ""
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[11px] uppercase tracking-wide text-gray-400 dark:text-white/40 ${
                    muted ? "opacity-80" : ""
                  }`}
                >
                  {label}
                </p>
                {emphasis === "pill" ? (
                  <span
                    className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${accentClass}`}
                  >
                    {value}
                  </span>
                ) : href ? (
                  <a
                    href={href}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-200"
                    title={value}
                  >
                    {value}
                  </a>
                ) : (
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      muted ? "text-gray-400 dark:text-white/40" : "text-gray-800 dark:text-white"
                    }`}
                    title={value}
                  >
                    {value}
                  </p>
                )}
                {secondary && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-white/60" title={secondary}>
                    {secondary}
                  </p>
                )}
                {hint && (
                  <p className={`mt-1 text-xs font-medium ${hintClass ?? "text-gray-400 dark:text-white/50"}`}>
                    {hint}
                  </p>
                )}
              </div>

              {editable && field && (
                <button
                  type="button"
                  onClick={() => onEditField?.(field)}
                  className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-gray-400 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-200 dark:text-white/40 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200"
                  title={`Edit ${label.toLowerCase()}`}
                >
                  <PencilLine className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Edit {label}</span>
                </button>
              )}
            </div>
          ),
        )}
    </div>
  );
}
