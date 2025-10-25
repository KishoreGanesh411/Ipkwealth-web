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
  Copy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { UPDATE_LEAD } from "@/core/graphql/leads.gql";
import LeadStatusBadge from "@/components/sales/myleads/LeadStatusBadge";
import { leadOptions, valueToLabel } from "@/components/lead/types";
import {
  initials,
  resolveStageDisplay,
  formatDateDisplay,
  formatAgingDays,
  formatInvestmentRange,
  formatSipAmount,
  humanize,
} from "./interface/utils";
import { parseISO, differenceInCalendarDays, isValid as isValidDate } from "date-fns";
import type { LeadProfile, LeadEditFormValues } from "./interface/types";
import LeadEditModal from "./LeadEditModal";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";

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
  lines?: string[]; // optional extra lines (renders under value)
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
  const occupationLines: string[] = [];
  if (profession) occupationLines.push(profession);
  if (designation) occupationLines.push(designation);
  if (companyName) occupationLines.push(companyName);

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
      // show each on its own line for clarity
      lines: occupationLines.length ? occupationLines : undefined,
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
    // Company is represented inside Occupation box as a line; hide separate box
    {
      key: "company",
      icon: Building,
      label: "Company",
      value: companyName || "Not captured",
      muted: !companyName,
      visible: false,
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
  ].filter((field) => field.visible !== false);

  const metaFieldsFiltered = metaFields.filter(
    (field) =>
      !["occupation", "investmentRange", "location", "product", "age", "gender", "sipAmount"].includes(field.key),
  );

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
    const enteredOnRaw = lead.firstSeenAt || lead.createdAt || null;
    let agingDaysNum: number | null = null;
    if (enteredOnRaw) {
      try {
        const d = parseISO(enteredOnRaw);
        if (isValidDate(d)) agingDaysNum = Math.max(0, differenceInCalendarDays(new Date(), d));
      } catch {
        // ignore
      }
    }
    const leadSourceLabel = valueToLabel((lead.leadSource as any) ?? "", leadOptions);

    // Product
    const productLabel = (lead.product ?? "").toString().trim() || "Not specified";

    // Investment or SIP
    const invRaw = (lead.investmentRange ?? "").toString().trim();
    const sipNum = typeof lead.sipAmount === "number" && Number.isFinite(lead.sipAmount)
      ? lead.sipAmount
      : null;
    const invValue = invRaw
      ? formatInvestmentRange(invRaw)
      : sipNum !== null
      ? formatSipAmount(sipNum)
      : "Not captured";

    const items = [
      { label: "Lead source", value: leadSourceLabel || "Not captured" },
      { label: "Entered on", value: formatDateDisplay(enteredOnRaw) },
      { label: "Aging", value: formatAgingDays(agingDaysNum ?? undefined) },
      { label: "Product", value: productLabel },
      { label: "Investment / SIP", value: invValue },
    ];
    return items;
  }, [lead.leadSource, lead.firstSeenAt, lead.createdAt, lead.product, lead.investmentRange, lead.sipAmount]);

  const highlightSummary = leadSummary.slice(0, 2);
  const detailSummary = leadSummary.slice(2);
  const highlightEntries = [...highlightSummary];
  const highlightFillers = [{ label: "Stage", value: stageDisplay.label }];
  highlightFillers.forEach((tile) => {
    if (highlightEntries.length < 3) highlightEntries.push(tile);
  });

  const detailEntries = [...detailSummary];
  const detailFillers: Array<{ label: string; value: string }> = [];
  detailFillers.forEach((tile) => {
    if (detailEntries.length < 4) detailEntries.push(tile);
  });

  const rawPrimaryPhone =
    lead.mobile ?? (lead.phone as any) ?? (lead.phoneNormalized as any) ?? null;
  const phoneDisplay = rawPrimaryPhone ? String(rawPrimaryPhone).trim() : "Not provided";
  const phoneHref = rawPrimaryPhone ? `tel:${String(rawPrimaryPhone).replace(/\s+/g, "")}` : undefined;
  const emailDisplay = lead.email?.trim() || "No email";
  const emailHref = lead.email ? `mailto:${lead.email}` : undefined;
  const locationDisplay = lead.location?.trim() || "Location unknown";
  const personalAgeDisplay = hasValidAge ? ageDisplay : "—";

  const personalDetails = [
    { label: "Age", value: personalAgeDisplay },
    { label: "Gender", value: genderDisplay },
    { label: "Email", value: emailDisplay, href: emailHref },
    { label: "Contact", value: phoneDisplay, href: phoneHref },
    { label: "Location", value: locationDisplay },
    { label: "Occupation", value: occupationPrimary || "Not captured" },
    { label: "Designation", value: designation || "Not captured" },
  ];

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
  const remarkModal = useModal(false);
  const bioModal = useModal(false);

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
        <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:justify-between">
          {/* Left column: avatar + name + status */}
          <div className="relative w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-5 text-sm text-gray-900 shadow-xl dark:border-white/10 dark:bg-gray-900 dark:text-white">

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-lg font-semibold text-emerald-700 transition-colors dark:bg-emerald-400/20 dark:text-emerald-100">
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
              </div>
            </div>

            {personalDetails.length > 0 && (
              <div className="relative mt-4 flex flex-wrap gap-2">
                {personalDetails.map(({ label, value, href }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-semibold shadow-sm dark:border-white/10 dark:bg-gray-800"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs uppercase tracking-wide text-emerald-500 dark:text-emerald-200">
                      {label}
                    </span>
                    {href ? (
                      <a href={href} className="text-gray-900 hover:underline dark:text-white">
                        {value}
                      </a>
                    ) : (
                      <span className="text-gray-900 dark:text-white">{value}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Right column: summary card */}
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white text-sm text-gray-900 shadow-xl dark:border-white/10 dark:bg-gray-900 dark:text-white">
            <div className="relative grid gap-4 p-4 sm:grid-cols-[1.2fr_auto]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-500 dark:text-emerald-300">
                  Lead code
                </p>
                <div className="mt-2 flex items-baseline gap-3">
                  <p className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    {lead.leadCode ?? "Not generated"}
                  </p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold uppercase text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                    {stageDisplay.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/70">
                  Share this code with teammates to find this profile instantly.
                </p>
              </div>
              <div className="flex flex-col items-end justify-between gap-3">
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-white/60">
                    Entered on
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {leadSummary[1]?.value ?? "—"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!lead.leadCode}
                  onClick={() => lead.leadCode && navigator.clipboard.writeText(lead.leadCode)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    lead.leadCode
                      ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white dark:border-emerald-300 dark:bg-transparent"
                      : "cursor-not-allowed border-gray-200 text-gray-400 dark:border-white/10 dark:text-white/40"
                  }`}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex flex-wrap gap-2">
                {highlightEntries.map(({ label, value }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-gray-700 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {detailEntries.map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm dark:border-white/5 dark:bg-gray-900"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">
                      {label}
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Remark + Bio row with hover previews and view-more */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <HoverPreviewCard
            label="Latest remark"
            text={lead.remark ?? ""}
            onViewMore={remarkModal.openModal}
          />
          <HoverPreviewCard
            label="Bio"
            text={(lead as any).bioText ?? ""}
            onViewMore={bioModal.openModal}
          />
        </div>

        {/* Dynamic meta fields: display all available data points */}
        <div className="mt-5 meta-grid">
          {metaFieldsFiltered.map(({ key, visible: _visible, ...field }) => (
            <MetaField key={key} {...field} />
          ))}
        </div>
        {/* Biography text moved to hover/Modal row above */}
              </div>
      {/* Full text modals */}
      <RemarkBioModal
        title="Lead remark"
        isOpen={remarkModal.isOpen}
        onClose={remarkModal.closeModal}
        body={lead.remark ?? "No remark added yet."}
      />
      <RemarkBioModal
        title="Lead bio"
        isOpen={bioModal.isOpen}
        onClose={bioModal.closeModal}
        body={(lead as any).bioText ?? "No bio added yet."}
      />
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
  lines,
  muted = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  secondary?: string | null;
  lines?: string[];
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-gray-50/60 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 dark:text-white/50">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className={`mt-1 font-semibold ${muted ? "text-gray-400 dark:text-white/40" : "text-gray-900 dark:text-white"}`}>{value}</div>
      {Array.isArray(lines) && lines.length > 0 ? (
        <div className="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-white/60">
          {lines.map((ln, i) => (
            <div key={i} className="truncate" title={ln}>
              {ln}
            </div>
          ))}
        </div>
      ) : secondary ? (
        <div className="mt-1 text-xs text-gray-500 dark:text-white/60" title={secondary}>
          {secondary}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ Local UI --------------------------------- */
function HoverPreviewCard({
  label,
  text,
  onViewMore,
}: {
  label: string;
  text: string;
  onViewMore: () => void;
}) {
  const preview = (text || "").trim();
  const empty = preview.length === 0;
  return (
    <div className="group relative rounded-2xl border border-gray-100 bg-gray-50/60 p-4 text-sm transition-all hover:border-emerald-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-white/60">{label}</div>
        <button
          type="button"
          onClick={onViewMore}
          className="inline-flex items-center rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:text-gray-200 dark:hover:border-emerald-300"
        >
          View
        </button>
      </div>
      <div className={`mt-2 line-clamp-2 whitespace-pre-wrap ${empty ? "text-gray-400 dark:text-white/40" : "text-gray-800 dark:text-white/80"}`}>
        {empty ? "—" : preview}
      </div>
      {/* Hover popover */}
      {!empty && (
        <div className="pointer-events-none absolute inset-x-4 -bottom-2 z-20 hidden origin-top rounded-xl border border-gray-200 bg-white p-3 text-[13px] text-gray-800 shadow-2xl transition-all duration-200 group-hover:block group-hover:-translate-y-1 group-hover:opacity-100 dark:border-white/10 dark:bg-gray-900 dark:text-white/80">
          <div className="max-h-40 overflow-auto whitespace-pre-wrap">
            {preview}
          </div>
        </div>
      )}
    </div>
  );
}

function RemarkBioModal({ title, isOpen, onClose, body }: { title: string; isOpen: boolean; onClose: () => void; body: string }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[720px] m-4">
      <div className="p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-gray-800 dark:text-white/80">
          {body?.trim() ? body : "—"}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}



