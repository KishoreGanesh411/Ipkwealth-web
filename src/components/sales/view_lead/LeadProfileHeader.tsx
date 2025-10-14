import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  MessageCircle,
  RefreshCcw,
  PencilLine,
  Briefcase,
  CircleDollarSign,
  MapPin,
  Package,
  Calendar,
  Building,
  User,
  Code,
  DollarSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { UPDATE_LEAD } from "@/core/graphql/leads.gql";
import LeadStatusBadge from "@/components/sales/myleads/LeadStatusBadge";
import {
  initials,
  resolveStageDisplay,
  formatDateDisplay,
  formatAgingDays,
  formatInvestmentRange,
  formatSipAmount,
  humanize,
} from "./interface/utils";
import type { LeadProfile, LeadEditFormValues } from "./interface/types";
import LeadEditModal from "./LeadEditModal";

/**
 * LeadProfileHeader component displays a lead summary and exposes an edit button.
 *
 * It now supports multiple phone numbers with tags (primary/whatsapp) and removes
 * the client type and RM assignment details. If the lead has multiple phone
 * entries (from the `phones` relation), each will be rendered as its own chip
 * with the appropriate icon (telephone or WhatsApp). The edit modal is opened
 * when the â€œEditâ€ button is clicked, and the data passed into the modal is
 * normalized to match our Prisma model.
 */

type Props = {
  lead: LeadProfile;
  loading: boolean;
  /** determines if the user can click the Edit button */
  canEditProfile: boolean;
  /** callback invoked after a successful update to refresh parent data */
  onProfileRefresh?: () => void;
};

type HeaderMetaField = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
  secondary?: string | null;
  muted?: boolean;
  visible?: boolean;
};

export default function LeadProfileHeader({ lead, loading, canEditProfile, onProfileRefresh }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [updateLeadMutation, { loading: saving }] = useMutation(UPDATE_LEAD);

  // Normalize the lead status; treat ASSIGNED as PENDING for display
  const displayStatus = lead.status === "ASSIGNED" ? "PENDING" : lead.status;
  const stageDisplay = resolveStageDisplay({
    rawStage: (lead as any).clientStageRaw,
    normalizedStage: (lead.clientStage as any) ?? undefined,
    status: displayStatus as string,
  });

  /** Determine the color of the stage hint */
  const stageHintClass =
    stageDisplay.state === "pending"
      ? "text-amber-600 dark:text-amber-200"
      : stageDisplay.state === "revisit"
      ? "text-rose-600 dark:text-rose-200"
      : "text-gray-500 dark:text-white/60";

  /** Select an icon based on the stage state */
  const StageIcon =
    stageDisplay.state === "pending"
      ? Clock3
      : stageDisplay.state === "revisit"
      ? RefreshCcw
      : CheckCircle2;

  const normalizeText = (value?: string | null) => (value ?? "").toString().trim();

  const profession = normalizeText(lead.profession);
  const designation = normalizeText(lead.designation);
  const companyName = normalizeText(lead.companyName);
  const location = normalizeText(lead.location);
  const product = normalizeText(lead.product);
  const genderRaw = normalizeText(lead.gender);
  const referralName = normalizeText(lead.referralName);
  const referralCode = normalizeText(lead.referralCode);
  const investmentRangeRaw = normalizeText(lead.investmentRange);

  const occupationPrimary = profession || designation || companyName;
  const occupationKey = occupationPrimary ? occupationPrimary.toLowerCase() : "";
  const occupationSecondaryParts: string[] = [];
  if (designation && designation.toLowerCase() !== occupationKey) {
    occupationSecondaryParts.push(designation);
  }
  if (companyName && companyName.toLowerCase() !== occupationKey) {
    occupationSecondaryParts.push(companyName);
  }
  const occupationSecondary =
    occupationSecondaryParts.length > 0 ? occupationSecondaryParts.join(" | ") : null;

  const hasInvestmentRange = Boolean(investmentRangeRaw);
  const sipAmountValue =
    typeof lead.sipAmount === "number" && Number.isFinite(lead.sipAmount) ? lead.sipAmount : null;
  const hasSipAmount = sipAmountValue !== null;
  const sipDisplay = formatSipAmount(sipAmountValue);
  const investmentValue = hasInvestmentRange
    ? formatInvestmentRange(investmentRangeRaw)
    : hasSipAmount
    ? sipDisplay
    : "Not captured";
  const investmentSecondary = hasInvestmentRange && hasSipAmount ? sipDisplay : null;

  const genderDisplay = genderRaw ? humanize(genderRaw) : "Unknown";

  const hasReferral = Boolean(referralName || referralCode);
  const referralPrimary = referralName || referralCode || "";
  const referralSecondary = referralName && referralCode ? `Code: ${referralCode}` : null;

  const ageRaw = (lead as any).age;
  const hasAgeField = typeof ageRaw !== "undefined";
  const ageNumber = Number(ageRaw);
  const hasValidAge = hasAgeField && Number.isFinite(ageNumber) && ageNumber > 0;
  const ageDisplay = hasValidAge ? String(Math.round(ageNumber)) : "Unknown";

  const metaFields: HeaderMetaField[] = [
    {
      key: "occupation",
      icon: Briefcase,
      label: "Occupation",
      value: occupationPrimary || "Not captured",
      secondary: occupationSecondary,
      muted: !(occupationPrimary || occupationSecondary),
    },
    {
      key: "investmentRange",
      icon: CircleDollarSign,
      label: "Investment range",
      value: investmentValue,
      secondary: investmentSecondary,
      muted: !(hasInvestmentRange || hasSipAmount),
    },
    {
      key: "location",
      icon: MapPin,
      label: "Location",
      value: location || "Unknown",
      muted: !location,
    },
    {
      key: "product",
      icon: Package,
      label: "Product",
      value: product || "Not specified",
      muted: !product,
    },
    {
      key: "age",
      icon: Calendar,
      label: "Age",
      value: ageDisplay,
      muted: !hasValidAge,
      visible: hasAgeField,
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
      value: companyName || "Not captured",
      muted: !companyName,
      secondary: designation && designation.toLowerCase() !== occupationKey ? designation : null,
    },
    {
      key: "referral",
      icon: Code,
      label: "Referral",
      value: referralPrimary || "Not available",
      secondary: referralSecondary,
      muted: !hasReferral,
      visible: hasReferral,
    },
    {
      key: "sipAmount",
      icon: DollarSign,
      label: "SIP amount",
      value: sipDisplay,
      muted: !hasSipAmount,
    },
  ].filter((field) => field.visible !== false);

  /**
   * Build an array of quick contact chips. The list always begins with an
   * email (if present) and then one chip per phone in the `phones` array. Each
   * phone chip uses a WhatsApp icon if the number is flagged as such, or a
   * standard phone icon otherwise. If the lead does not have a populated
   * `phones` array, fall back to `mobile` or `phone` on the root object.
   */
  const quickChips = useMemo(() => {
    const chips: Array<{ key: string; icon: LucideIcon; label: string; href: string }> = [];
    if (lead.email) {
      chips.push({ key: "email", icon: Mail, label: lead.email, href: `mailto:${lead.email}` });
    }
    // Compose phone chips from relation if available
    if (Array.isArray((lead as any).phones) && (lead as any).phones.length > 0) {
      (lead as any).phones.forEach((phone: any, idx: number) => {
        const number = String(phone?.number ?? "");
        if (!number) return;
        const key = `phone-${idx}`;
        const isWa = Boolean(phone.isWhatsapp);
        const href = isWa
          ? `https://wa.me/${number.replace(/\D/g, "")}`
          : `tel:${number.replace(/\s+/g, "")}`;
        const icon = isWa ? MessageCircle : Phone;
        chips.push({ key, icon, label: number, href });
      });
    } else {
      // fallback: use mobile or phone on root
      const rawNumber = lead.mobile ?? (lead.phone as any);
      if (rawNumber) {
        chips.push({
          key: "phone-single",
          icon: Phone,
          label: rawNumber,
          href: `tel:${String(rawNumber).replace(/\s+/g, "")}`,
        });
      }
    }
    return chips;
  }, [lead.email, lead.mobile, lead.phone, (lead as any).phones]);

  /** Basic summary fields displayed on the header card */
  const leadSummary = useMemo(() => {
    return [
      { label: "Lead source", value: lead.leadSource?.trim() || "Not captured" },
      { label: "Entered on", value: formatDateDisplay(lead.enteredAt) },
      { label: "Aging", value: formatAgingDays(lead.agingDays) },
    ];
  }, [lead.leadSource, lead.enteredAt, lead.agingDays]);

  /**
   * Prepare initial values for the edit modal. We map DB fields into
   * user-facing inputs and normalize the phone fields into primary/WhatsApp
   * entries for easier editing.
   */
  const modalInitialValues = useMemo((): LeadEditFormValues => {
    // Determine a primary phone and WhatsApp phone from the phones array
    let primaryPhone: string | undefined;
    let whatsappPhone: string | undefined;
    if (Array.isArray((lead as any).phones) && (lead as any).phones.length > 0) {
      const list = (lead as any).phones;
      const primary = list.find((p: any) => Boolean(p.isPrimary));
      const whatsapp = list.find((p: any) => Boolean(p.isWhatsapp));
      primaryPhone = primary?.number ?? undefined;
      whatsappPhone = whatsapp?.number ?? undefined;
    }
    // fallback to root phone if needed
    if (!primaryPhone) {
      primaryPhone = (lead as any).phone ?? (lead as any).mobile ?? undefined;
    }
    return {
      leadCode: lead.leadCode ?? "",
      leadSource: lead.leadSource ?? "",
      firstName: lead.firstName ?? "",
      lastName: lead.lastName ?? "",
      fullName: lead.name ?? "",
      email: lead.email ?? "",
      primaryPhone: primaryPhone ?? "",
      whatsappPhone: whatsappPhone ?? "",
      location: lead.location ?? "",
      profession: lead.profession ?? "",
      designation: lead.designation ?? "",
      companyName: lead.companyName ?? "",
      product: lead.product ?? "",
      investmentRange: lead.investmentRange ?? "",
      sipAmount: lead.sipAmount ? String(lead.sipAmount) : "",
      gender: (lead.gender ?? "").toUpperCase(),
      remark: lead.remark ?? "",
      referralName: (lead as any).referralName ?? "",
      leadSourceOther: (lead as any).leadSourceOther ?? "",
      age: (lead as any).age ?? null,
      referralCode: (lead as any).referralCode ?? "",
      bioText: (lead as any).bioText ?? "",
    } as LeadEditFormValues;
  }, [lead]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-400 dark:text-white/40">
        Loading lead profile...
      </div>
    );
  }

  /** handle opening the edit modal */
  const handleEditClick = () => {
    if (!canEditProfile) return;
    setIsEditing(true);
  };

  const handleModalClose = () => setIsEditing(false);

  /**
   * Submit handler for the edit modal. We normalize phone numbers into phone
   * and mobile fields (primary and WhatsApp respectively) and omit client
   * type(s). Only fields with non-empty values are sent; empty strings are
   * converted to null.
   */
  const handleModalSubmit = async (values: LeadEditFormValues) => {
    const trimOrNull = (val: any) => {
      const str = String(val ?? "").trim();
      return str.length ? str : null;
    };
    const sanitized: Record<string, any> = {
      firstName: trimOrNull(values.firstName),
      lastName: trimOrNull(values.lastName),
      name: String(values.fullName ?? "").trim(),
      email: trimOrNull(values.email),
      phone: trimOrNull(values.primaryPhone),
      mobile: trimOrNull(values.whatsappPhone),
      location: trimOrNull(values.location),
      profession: trimOrNull(values.profession),
      designation: trimOrNull(values.designation),
      companyName: trimOrNull(values.companyName),
      product: trimOrNull(values.product),
      investmentRange: trimOrNull(values.investmentRange),
      gender: trimOrNull(values.gender),
      remark: trimOrNull(values.remark),
      referralName: trimOrNull(values.referralName),
      leadSourceOther: trimOrNull(values.leadSourceOther),
    };
    const sipStr = String(values.sipAmount ?? "").replace(/,/g, "").trim();
    if (sipStr) {
      const sipValue = Number(sipStr);
      sanitized.sipAmount = Number.isNaN(sipValue) ? null : sipValue;
    } else {
      sanitized.sipAmount = null;
    }
    try {
      await updateLeadMutation({ variables: { id: lead.id, input: sanitized } });
      toast.success("Lead details updated");
      setIsEditing(false);
      onProfileRefresh?.();
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to update lead");
    }
  };

  return (
    <>
      <div className="card card-padded">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Left column: avatar + name + status */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-lg font-semibold text-emerald-700 transition-colors dark:bg-emerald-500/20 dark:text-emerald-200">
                {initials(lead.name)}
              </div>
              {canEditProfile && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  disabled={loading}
                  aria-label="Edit lead details"
                  title="Edit lead details"
                  className="absolute -bottom-2 left-1/2 inline-flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105 hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-75 sm:-bottom-3 sm:left-auto sm:right-0 sm:translate-x-0 sm:border-white/90 md:-right-2 dark:border-emerald-500/40 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold capitalize text-gray-900 dark:text-white">
                  {lead.name ?? "Unnamed lead"}
                </h1>
                <LeadStatusBadge status={displayStatus} size="md" />
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${stageDisplay.pillClass}`}
                >
                  <StageIcon className="h-3.5 w-3.5" />
                  {stageDisplay.label}
                </span>
              </div>
              {stageDisplay.hint && (
                <p className={`mt-1 text-xs font-medium ${stageHintClass}`}>{stageDisplay.hint}</p>
              )}
              {quickChips.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {quickChips.map(({ key, icon: Icon, label, href }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chip"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Right column: summary card */}
          <div className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100 md:pr-6 md:text-right lg:pr-8">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-wide text-emerald-600/80 dark:text-emerald-200/80">
                Lead code
              </span>
              <span
                className={`text-base font-semibold ${
                  lead.leadCode
                    ? "text-emerald-700 dark:text-emerald-50"
                    : "text-emerald-400 dark:text-emerald-200/70"
                }`}
              >
                {lead.leadCode ?? "Not generated"}
              </span>
            </div>
            <div className="mt-3 grid gap-3 text-left sm:grid-cols-3 md:text-right">
              {leadSummary.map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wide text-emerald-500/70 dark:text-emerald-200/70">
                    {label}
                  </span>
                  <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-50">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Dynamic meta fields: display all available data points */}
        <div className="mt-5 meta-grid">
          {metaFields.map(({ key, visible: _visible, ...field }) => (
            <MetaField key={key} {...field} />
          ))}
        </div>
        {/* Latest remark */}
        {lead.remark && (
          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
            <span className="font-semibold text-gray-900 dark:text-white">Latest remark:</span>{" "}
            {lead.remark}
          </div>
        )}
        {/* Biography text if available */}
        {(lead as any).bioText && (
          <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
            <span className="font-semibold text-gray-900 dark:text-white">Bio:</span>{" "}
            {(lead as any).bioText}
          </div>
        )}
      </div>
      <LeadEditModal
        isOpen={isEditing}
        onClose={handleModalClose}
        initial={modalInitialValues}
        saving={saving}
        onSubmit={handleModalSubmit}
        title="Edit lead details"
      />
    </>
  );
}

/**
 * Simple meta field used in the header summary. Accepts an icon, label, and
 * value. Handles dark mode and truncation.
 */
function MetaField({
  icon: Icon,
  label,
  value,
  secondary,
  muted = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  secondary?: string | null;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-gray-50/60 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 dark:text-white/50">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div
        className={`mt-1 truncate font-semibold ${
          muted ? "text-gray-400 dark:text-white/40" : "text-gray-900 dark:text-white"
        }`}
        title={value}
      >
        {value}
      </div>
      {secondary ? (
        <div className="mt-1 text-xs text-gray-500 dark:text-white/60" title={secondary}>
          {secondary}
        </div>
      ) : null}
    </div>
  );
}


