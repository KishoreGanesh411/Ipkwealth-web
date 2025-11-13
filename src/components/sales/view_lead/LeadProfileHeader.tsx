import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Copy,
  PhoneCall,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Note: Use specific field mutations supported by the API schema
import { UPDATE_LEAD_BIO, UPDATE_LEAD_REMARK } from "./gql/view_lead.gql";
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
import type { LeadProfile, LeadPhone } from "./interface/types";
import type { LeadEditModalValues } from "../editLead/LeadEditModal";
import LeadEditModal from "../editLead/LeadEditModal";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/context/AuthContex";
import { ADD_LEAD_PHONE } from "./gql/view_lead.gql";

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
  /** optional flag; accepted for compatibility */
  isAdmin?: boolean;
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
  const [mutateBio, { loading: savingBio }] = useMutation(UPDATE_LEAD_BIO);
  const [mutateRemark, { loading: savingRemark }] = useMutation(UPDATE_LEAD_REMARK);
  const [mutAddPhone, { loading: addingPhone }] = useMutation(ADD_LEAD_PHONE);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  // Pipeline stage hint logic can still consider legacy LeadStatus
  const displayStatus = lead.status === "ASSIGNED" ? "PENDING" : lead.status;
  // Header Status badge must reflect the Stage Filter (RM intent)
  const headerStatus = (lead.stageFilter as any) ?? null;
  const stageDisplay = resolveStageDisplay({
    rawStage: (lead.clientStageRaw as any) ?? undefined,
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

  // Occupation: prefer occupations[0] from new schema, fallback to legacy top-level fields
  const occ0 = Array.isArray(lead.occupations) && lead.occupations.length > 0 ? lead.occupations[0] : undefined;
  const legacyProfession = normalizeText(lead.profession);
  const profession = normalizeText((occ0?.profession as any) ?? legacyProfession);
  // Human-readable version for enum-like backend values such as SELF_EMPLOYED
  const professionDisplay = profession ? humanize(profession) : "";
  const designation = normalizeText((occ0?.designation as any) ?? lead.designation);
  const companyName = normalizeText((occ0?.companyName as any) ?? lead.companyName);
  const location = normalizeText(lead.location);
  const product = normalizeText(lead.product);
  const genderRaw = normalizeText(lead.gender);
  const referralName = normalizeText(lead.referralName);
  const referralCode = normalizeText(lead.referralCode);
  const investmentRangeRaw = normalizeText(lead.investmentRange);

  const occupationPrimary = professionDisplay || designation || companyName;
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
  if (professionDisplay) occupationLines.push(professionDisplay);
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

  const genderDisplay = genderRaw ? humanize(genderRaw) : "";

  // Compute next follow-up chip text from nextActionDueAt
  const followUpChip = useMemo(() => {
    const dueAt = lead.nextActionDueAt as string | undefined | null;
    if (!dueAt) return { label: "", muted: true } as { label: string; muted: boolean };
    const dueMs = Date.parse(dueAt) - Date.now();
    const abs = Math.abs(dueMs);
    const mins = Math.round(abs / 60000);
    const hours = Math.round(abs / 3600000);
    const days = Math.round(abs / 86400000);
    let span = mins < 60 ? `${mins}m` : hours < 48 ? `${hours}h` : `${days}d`;
    const label = dueMs >= 0 ? `Due in ${span}` : `Overdue by ${span}`;
    return { label, muted: false };
  }, [lead.nextActionDueAt]);

  const hasReferral = Boolean(referralName || referralCode);
  const referralPrimary = referralName || referralCode || "";
  const referralSecondary = referralName && referralCode ? `Code: ${referralCode}` : null;

  const ageRaw = lead.age as any;
  const hasAgeField = typeof ageRaw !== "undefined";
  const ageNumber = Number(ageRaw);
  const hasValidAge = hasAgeField && Number.isFinite(ageNumber) && ageNumber > 0;
  const ageDisplay = hasValidAge ? String(Math.round(ageNumber)) : "Not captured";

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
      key: "followUp",
      icon: Clock3,
      label: "Follow-up",
      value: followUpChip.label || "Not scheduled",
      muted: !(lead.nextActionDueAt),
      visible: Boolean(lead.nextActionDueAt),
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
      value: location || "Not captured",
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
    if (Array.isArray(lead.phones) && lead.phones.length > 0) {
      lead.phones.forEach((phone: LeadPhone, idx: number) => {
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
      const rawNumber = lead.mobile ?? lead.phone;
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
  }, [lead.email, lead.phone, lead.phones]);

  /** Basic summary fields displayed on the header card */
  const leadSummary = useMemo(() => {
    const enteredOnRaw = lead.approachAt || lead.createdAt || null;
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
  }, [lead.leadSource, lead.approachAt, lead.createdAt, lead.product, lead.investmentRange, lead.sipAmount]);

  const highlightSummary = leadSummary.slice(0, 2);
  const detailSummary = leadSummary.slice(2);
  const highlightEntries = [...highlightSummary];
  const highlightFillers = [
    { label: "Stage", value: stageDisplay.label },
    { label: "Follow-up", value: followUpChip.label || "Not scheduled" },
  ];
  highlightFillers.forEach((tile) => {
    if (highlightEntries.length < 3) highlightEntries.push(tile);
  });

  const detailEntries = [...detailSummary];
  const detailFillers: Array<{ label: string; value: string }> = [];
  detailFillers.forEach((tile) => {
    if (detailEntries.length < 4) detailEntries.push(tile);
  });

  const rawPrimaryPhone =
    lead.mobile ?? lead.phone ?? lead.phoneNormalized ?? null;
  const phoneDisplay = rawPrimaryPhone ? String(rawPrimaryPhone).trim() : "Not provided";
  const phoneHref = rawPrimaryPhone ? `tel:${String(rawPrimaryPhone).replace(/\s+/g, "")}` : undefined;
  const emailDisplay = lead.email?.trim() || "";
  const emailHref = lead.email ? `mailto:${lead.email}` : undefined;
  const locationDisplay = lead.location?.trim() || "";
  const personalAgeDisplay = hasValidAge ? ageDisplay : "";

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
  const modalInitialValues = useMemo((): LeadEditModalValues => {
    // Determine a primary phone and WhatsApp phone from the phones array
    let primaryPhone: string | undefined;
    let whatsappPhone: string | undefined;
    if (Array.isArray(lead.phones) && lead.phones.length > 0) {
      const list = lead.phones as any[];
      const primary = list.find((p: any) => Boolean(p.isPrimary));
      const whatsapp = list.find((p: any) => Boolean(p.isWhatsapp));
      primaryPhone = primary?.number ?? undefined;
      whatsappPhone = whatsapp?.number ?? undefined;
    }
    // fallback to root phone if needed
    if (!primaryPhone) {
      primaryPhone = lead.phone ?? lead.mobile ?? undefined;
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
      // For edit modal, pass both legacy and new occupation shape (modal normalizes to occupations[])
      profession: (occ0?.profession as any) ?? (lead.profession as any) ?? "",
      designation: (occ0?.designation as any) ?? lead.designation ?? "",
      companyName: (occ0?.companyName as any) ?? lead.companyName ?? "",
      occupations: occ0
        ? [
            {
              profession: (occ0?.profession as any) ?? undefined,
              designation: (occ0?.designation as any) ?? undefined,
              companyName: (occ0?.companyName as any) ?? undefined,
              startedAt: (occ0 as any)?.startedAt ?? undefined,
              endedAt: (occ0 as any)?.endedAt ?? undefined,
            },
          ]
        : undefined,
      product: lead.product ?? "",
      investmentRange: lead.investmentRange ?? "",
      sipAmount: (typeof lead.sipAmount === 'number' ? lead.sipAmount : ""),
      gender: (lead.gender ?? "").toUpperCase(),
      remark: lead.remark ?? "",
      referralName: lead.referralName ?? "",
      leadSourceOther: lead.leadSourceOther ?? "",
      age: lead.age ?? null,
      referralCode: lead.referralCode ?? "",
      bioText: lead.bioText ?? "",
    } as LeadEditModalValues;
  }, [lead]);

  // Hooks must be called unconditionally and in the same order every render.
  // These were previously below an early `if (loading) return ...`,
  // which caused the hook order to change once loading flipped to false.
  const remarkModal = useModal(false);
  const bioModal = useModal(false);
  const addPhoneModal = useModal(false);

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
  const handleModalSubmit = async (values: LeadEditModalValues) => {
    // The current API supports granular mutations. Update what is supported
    // and avoid calling legacy updateLead (which returns 400 on this backend).
    const ops: Promise<any>[] = [];

    // Remark
    const nextRemark = String(values.remark ?? "").trim();
    const currRemark = String(lead.remark ?? "").trim();
    if (nextRemark !== currRemark) {
      ops.push(
        mutateRemark({ variables: { input: { leadId: lead.id, remark: nextRemark } } })
      );
    }

    // Bio text
    const nextBio = String(values.bioText ?? "").trim();
    const currBio = String(lead.bioText ?? "").trim();
    if (nextBio !== currBio) {
      ops.push(
        mutateBio({ variables: { input: { leadId: lead.id, bioText: nextBio } } })
      );
    }

    if (ops.length === 0) {
      toast.info("Nothing to update");
      setIsEditing(false);
      return;
    }

    try {
      await Promise.all(ops);
      toast.success("Profile updated");
      setIsEditing(false);
      onProfileRefresh?.();
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to update lead");
    }
  };

  // Add-phone local form state
  const [newPhone, setNewPhone] = useState<string>("");
  const [newLabel, setNewLabel] = useState<string>("MOBILE");
  const [newIsWa, setNewIsWa] = useState<boolean>(false);
  const [newMakePrimary, setNewMakePrimary] = useState<boolean>(false);

  const handleAddPhone = async () => {
    const number = newPhone.trim();
    if (!number) {
      toast.warn("Enter a phone number");
      return;
    }
    try {
      await mutAddPhone({
        variables: {
          leadId: lead.id,
          input: {
            number,
            label: (newLabel || "MOBILE") as any,
            isWhatsapp: newIsWa,
            isPrimary: isAdmin ? newMakePrimary : false,
          },
        },
      });
      toast.success("Phone added");
      addPhoneModal.closeModal();
      setNewPhone("");
      setNewIsWa(false);
      setNewMakePrimary(false);
      onProfileRefresh?.();
    } catch (e: any) {
      toast.error(e?.message || "Failed to add phone");
    }
  };

  const latestRemarkText = useMemo(() => {
    const list = Array.isArray(lead.remarks) ? lead.remarks : [];
    const ts = (s?: string | null) => {
      const t = s ? Date.parse(s) : NaN;
      return Number.isFinite(t) ? t : 0;
    };
    if (list && list.length > 0) {
      const sorted = list.slice().sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
      return (sorted[0]?.text ?? '').toString();
    }
    const raw: any = (lead as any).remark;
    if (raw && typeof raw === 'object') {
      if (typeof raw.text === 'string') return raw.text;
      try { return JSON.stringify(raw, null, 2); } catch { return String(raw); }
    }
    return (raw ?? '').toString();
  }, [lead.remarks, lead.remark]);

  const remarksModalBody = useMemo(() => {
    const list = Array.isArray(lead.remarks) ? lead.remarks : [];
    const ts = (s?: string | null) => {
      const t = s ? Date.parse(s) : NaN;
      return Number.isFinite(t) ? t : 0;
    };
    if (list && list.length > 0) {
      const sorted = list.slice().sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
      return sorted
        .map((r) => {
          const dt = r.createdAt ? formatDateDisplay(r.createdAt) : "";
          const by = r.author ? ` — ${r.author}` : "";
          const header = [dt, by].filter(Boolean).join("");
          return header ? `${r.text}\n${header}` : r.text;
        })
        .join("\n\n");
    }
    return (lead.remark ?? "").toString();
  }, [lead.remarks, lead.remark]);

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
                  <LeadStatusBadge status={headerStatus} size="md" />
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${stageDisplay.pillClass}`}
                  >
                    <StageIcon className="h-3.5 w-3.5" />
                    {stageDisplay.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => addPhoneModal.openModal()}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-emerald-500/30 dark:bg-white/5 dark:text-emerald-200"
                    title="Add another phone"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    Add phone
                  </button>
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
            text={latestRemarkText}
            onViewMore={remarkModal.openModal}
          />
          <HoverPreviewCard
            label="Bio"
            text={lead.bioText ?? ""}
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
        body={remarksModalBody || "No remark added yet."}
      />
      <RemarkBioModal
        title="Lead bio"
        isOpen={bioModal.isOpen}
        onClose={bioModal.closeModal}
        body={lead.bioText ?? "No bio added yet."}
      />
      <LeadEditModal
        isOpen={isEditing}
        onClose={handleModalClose}
        initial={modalInitialValues}
        saving={savingBio || savingRemark}
        onSubmit={handleModalSubmit}
        title="Edit lead details"
      />

      {/* Add Phone Modal */}
      <Modal isOpen={addPhoneModal.isOpen} onClose={addPhoneModal.closeModal} className="max-w-[560px] m-4">
        <div className="space-y-3 p-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Add phone</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="form-label">Phone number</label>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Enter number"
                className="form-input"
                inputMode="tel"
              />
            </div>
            <div>
              <label className="form-label">Label</label>
              <select value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="form-select">
                <option value="MOBILE">Mobile</option>
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="WHATSAPP">Whatsapp</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newIsWa} onChange={(e) => setNewIsWa(e.target.checked)} />
              Whatsapp
            </label>
            <label className="inline-flex items-center gap-2 text-sm opacity-100">
              <input
                type="checkbox"
                checked={newMakePrimary && isAdmin}
                onChange={(e) => setNewMakePrimary(e.target.checked)}
                disabled={!isAdmin}
              />
              Set as primary {isAdmin ? "" : "(admin only)"}
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={addPhoneModal.closeModal} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={handleAddPhone} disabled={addingPhone} className="btn btn-success">
              {addingPhone ? "Saving..." : "Add phone"}
            </button>
          </div>
        </div>
      </Modal>
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
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      className="relative rounded-2xl border border-gray-100 bg-gray-50/60 p-4 text-sm dark:border-white/10 dark:bg-white/[0.03]"
      whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
    >
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
      <div className={`mt-2 line-clamp-2 whitespace-pre-wrap text-[15px] ${empty ? "text-gray-400 dark:text-white/40" : "text-gray-800 dark:text-white/80"}`}>
        {empty ? "—" : preview}
      </div>
      {/* Hover popover (Framer Motion) */}
      <AnimatePresence>
        {!empty && hover && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: -4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none absolute inset-x-4 -bottom-2 z-20 origin-top rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 shadow-2xl dark:border-white/10 dark:bg-gray-900 dark:text-white/80"
          >
            <div className="max-h-40 overflow-auto whitespace-pre-wrap">
              {preview}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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





