import { useMemo, useState, type ReactNode } from "react";
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
  Briefcase, // Keep for occupation logic
  CircleDollarSign,
  MapPin, // Keep for location logic
  Package,
  Calendar,
  Building, // Keep for occupation logic
  User,
  Code,
  Copy, // Keep for lead code copy
  PhoneCall,
  CalendarClock,
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
 * It now renders a single-card header matching the new UI specification,
 * organizing data into three columns: Profile, Contact Details, and Status.
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

// Type for the new center-column grid
type ContactGridField = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  muted?: boolean;
};

export default function LeadProfileHeader({ lead, loading, canEditProfile, onProfileRefresh }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [mutateBio, { loading: savingBio }] = useMutation(UPDATE_LEAD_BIO);
  const [mutateRemark, { loading: savingRemark }] = useMutation(UPDATE_LEAD_REMARK);
  const [mutAddPhone, { loading: addingPhone }] = useMutation(ADD_LEAD_PHONE);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  // --- Data Computations (largely unchanged) ---

  // Pipeline stage hint logic
  const displayStatus = lead.status === "ASSIGNED" ? "PENDING" : lead.status;
  // Header Status badge must reflect the Stage Filter (RM intent)
  const headerStatus = (lead.stageFilter as any) ?? null;
  const stageDisplay = resolveStageDisplay({
    rawStage: (lead.clientStageRaw as any) ?? undefined,
    normalizedStage: (lead.clientStage as any) ?? undefined,
    status: displayStatus as string,
  });

  const normalizeText = (value?: string | null) => (value ?? "").toString().trim();

  // Occupation data (needed for modal)
  const occ0 = Array.isArray(lead.occupations) && lead.occupations.length > 0 ? lead.occupations[0] : undefined;

  // Various text fields
  const product = normalizeText(lead.product);
  const genderRaw = normalizeText(lead.gender);
  const referralName = normalizeText(lead.referralName);
  const referralCode = normalizeText(lead.referralCode);
  const investmentRangeRaw = normalizeText(lead.investmentRange);
  const referralPrimary = referralName || referralCode || "Not specified";
  const hasReferral = Boolean(referralName || referralCode);

  // Investment / SIP
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

  // Gender
  const genderDisplay = genderRaw ? humanize(genderRaw) : "Not set";

  // Age
  const ageRaw = lead.age as any;
  const hasAgeField = typeof ageRaw !== "undefined";
  const ageNumber = Number(ageRaw);
  const hasValidAge = hasAgeField && Number.isFinite(ageNumber) && ageNumber > 0;
  const ageDisplay = hasValidAge ? String(Math.round(ageNumber)) : "Not set";

  // Contact Info
  const rawPrimaryPhone =
    lead.mobile ?? lead.phone ?? lead.phoneNormalized ?? null;
  const emailDisplay = lead.email?.trim() || "Not provided";

  const normalizedPhones = useMemo(() => {
    const entries = new Map<
      string,
      { label?: string | null; isWhatsapp?: boolean; isPrimary?: boolean }
    >();
    const add = (
      value?: string | null,
      meta?: { label?: string | null; isWhatsapp?: boolean; isPrimary?: boolean },
    ) => {
      if (!value) return;
      const trimmed = value.toString().trim();
      if (!trimmed) return;
      const existing = entries.get(trimmed);
      entries.set(trimmed, {
        label: meta?.label ?? existing?.label,
        isWhatsapp: meta?.isWhatsapp ?? existing?.isWhatsapp ?? false,
        isPrimary: meta?.isPrimary ?? existing?.isPrimary ?? false,
      });
    };
    add(rawPrimaryPhone, { isPrimary: true });
    if (Array.isArray(lead.phones)) {
      lead.phones.forEach((phone) =>
        add(phone.number, {
          label: phone.label,
          isWhatsapp: phone.isWhatsapp,
          isPrimary: phone.isPrimary,
        }),
      );
    }
    return Array.from(entries).map(([number, meta]) => ({
      number,
      label: meta.label,
      isWhatsapp: meta.isWhatsapp,
      isPrimary: meta.isPrimary,
    }));
  }, [lead.phones, rawPrimaryPhone]);
  const hasPhoneNumbers = normalizedPhones.length > 0;
  const fallbackPhone = rawPrimaryPhone ? String(rawPrimaryPhone).trim() : "";
  const phoneDisplay = (normalizedPhones[0]?.number ?? fallbackPhone) || "Not provided";

  const phoneListMarkup =
    hasPhoneNumbers && (
      <div className="flex flex-wrap gap-2">
        {normalizedPhones.map((phone) => (
          <span
            key={phone.number}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
          >
            <PhoneCall className="h-3 w-3 text-emerald-600" aria-hidden="true" />
            <span>{phone.number}</span>
            {phone.label && (
              <span className="rounded-full bg-emerald-100 px-2 py-[2px] text-[10px] font-semibold text-emerald-600 dark:bg-emerald-50/20 dark:text-emerald-200">
                {phone.label}
              </span>
            )}
            {phone.isWhatsapp && (
              <MessageCircle className="h-3 w-3 text-emerald-600" aria-label="WhatsApp" />
            )}
          </span>
        ))}
      </div>
    );
  const phoneListValue = hasPhoneNumbers ? phoneListMarkup : "Not provided";
  const nextFollowUpDisplay = lead.nextActionDueAt ? formatDateDisplay(lead.nextActionDueAt) : "Not scheduled";
  const hasNextFollowUp = Boolean(lead.nextActionDueAt);

  // Date / Aging
  const enteredOnRaw = lead.createdAt ?? null;
  const agingSourceRaw = lead.approachAt?.trim() ? lead.approachAt : enteredOnRaw;
  const agingDaysNum = useMemo(() => {
    if (agingSourceRaw) {
      try {
        const d = parseISO(agingSourceRaw);
        if (isValidDate(d)) return Math.max(0, differenceInCalendarDays(new Date(), d));
      } catch {}
    }
    return null;
  }, [agingSourceRaw]);
  const agingDisplay = formatAgingDays(agingDaysNum ?? undefined);

  const lastActivityAt = useMemo(() => {
    const candidates: number[] = [];
    const pushDate = (value?: string | null) => {
      if (!value) return;
      const ts = Date.parse(value);
      if (Number.isFinite(ts)) candidates.push(ts);
    };
    pushDate(lead.lastContactedAt);
    pushDate(lead.lastSeenAt);
    pushDate(lead.approachAt);
    if (Array.isArray(lead.events)) {
      lead.events.forEach((ev) => pushDate(ev.occurredAt));
    }
    if (Array.isArray(lead.remarks)) {
      lead.remarks.forEach((remark) => pushDate(remark.createdAt));
    }
    if (candidates.length === 0) return null;
    return new Date(Math.max(...candidates)).toISOString();
  }, [lead.events, lead.lastContactedAt, lead.lastSeenAt, lead.approachAt, lead.remarks]);
  const lastContactRaw = lead.lastContactedAt ?? lastActivityAt;
  const lastSeenRaw = lead.lastSeenAt ?? lastActivityAt;

  /**
   * Data for the center "CONTACT & DETAILS" grid
   */
  const contactDetailsGrid = useMemo((): ContactGridField[] => {
    return [
      {
        key: "email",
        icon: Mail,
        label: "Email",
        value: emailDisplay,
        muted: !lead.email,
      },
      {
        key: "product",
        icon: Package,
        label: "Product",
        value: product || "Not specified",
        muted: !product,
      },
      {
        key: "investment",
        icon: CircleDollarSign,
        label: "Investment / SIP",
        value: investmentValue,
        muted: !(hasInvestmentRange || hasSipAmount),
      },
      {
        key: "phones",
        icon: Phone,
        label: "Phones",
        value: phoneListValue,
        muted: !hasPhoneNumbers,
      },
      {
        key: "nextFollowUp",
        icon: CalendarClock,
        label: "Next follow-up",
        value: nextFollowUpDisplay,
        muted: !hasNextFollowUp,
      },
      {
        key: "lastContact",
        icon: PhoneCall,
        label: "Last Contact",
        value: lastContactRaw ? formatDateDisplay(lastContactRaw) : "Not captured",
        muted: !lastContactRaw,
      },
      {
        key: "lastSeen",
        icon: Calendar,
        label: "Last Seen",
        value: lastSeenRaw ? formatDateDisplay(lastSeenRaw) : "Not captured",
        muted: !lastSeenRaw,
      },
    ];
  }, [
    emailDisplay,
    product,
    investmentValue,
    hasInvestmentRange,
    hasSipAmount,
    phoneListValue,
    hasPhoneNumbers,
    nextFollowUpDisplay,
    hasNextFollowUp,
    lastContactRaw,
    lastSeenRaw,
  ]);

  /**
   * Prepare initial values for the edit modal.
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

  // Modals
  const remarkModal = useModal(false); // Remark modal is no longer used here, but keeping for bio
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
   * Submit handler for the edit modal.
   */
  const handleModalSubmit = async (values: LeadEditModalValues) => {
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

  // Remark/Bio text logic (unchanged)
  // Note: latestRemarkText is no longer used in this component,
  // but remark data is still needed for the edit modal
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
      <div className="card rounded-2xl shadow-lg">
        {/* NEW 3-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 items-start gap-6 p-6 lg:grid-cols-12">
          {/* Col 1: Profile */}
          <div className="flex items-center gap-4 lg:col-span-5">
            {/* Avatar + Edit */}
            <div className="relative flex-shrink-0">
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
                  className="absolute -bottom-2 -right-2 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105 hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-75 dark:border-gray-800"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Name, Code, Referral */}
            <div className="flex-grow">
              <h1 className="text-3xl font-bold capitalize text-gray-900 dark:text-white">
                {lead.name ?? "Unnamed lead"}
              </h1>
              <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {lead.leadCode ?? "No code"}
              </p>
              <div
                className={`mt-2 inline-flex items-center gap-2 text-base font-medium ${
                  hasReferral ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-white/50"
                }`}
              >
                <User className="h-4 w-4" />
                <span>Referred by: {referralPrimary}</span>
              </div>
              {/* Info: Age, Gender, Add Phone */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">AGE</span>
                  <span className="text-base font-semibold text-gray-800 dark:text-white">{ageDisplay}</span>
                </div>
                 <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">GENDER</span>
                  <span className="text-base font-semibold text-gray-800 dark:text-white">{genderDisplay}</span>
                </div>
                <button
                  type="button"
                  onClick={() => addPhoneModal.openModal()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-300 dark:border-white/20 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                  title="Add another phone"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  Add Phone
                </button>
              </div>
            </div>
          </div>

          {/* Col 2: Contact & Details */}
          <div className="lg:col-span-4 lg:border-l lg:pl-6 border-gray-200 dark:border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-white/60">
              Contact & Details
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6">
            {contactDetailsGrid.map((field) => {
              const valueTitle = typeof field.value === "string" ? field.value : undefined;
              return (
                <div key={field.key} className="flex items-start gap-3">
                  <field.icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      field.muted ? "text-gray-400 dark:text-white/40" : "text-emerald-500 dark:text-emerald-400"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-white/60">{field.label}</div>
                    <div
                      className={`mt-0.5 truncate text-base font-bold ${
                        field.muted ? "text-gray-400 dark:text-white/40" : "text-gray-900 dark:text-white"
                      }`}
                      title={valueTitle}
                    >
                      {field.value}
                    </div>
                  </div>
                </div>
              );
            })}
              {/* This fills the 6th grid slot if contactDetailsGrid has 5 items */}
              <div></div>
            </div>
          </div>

          {/* Col 3: Status & Key Dates */}
          <div className="lg:col-span-3 lg:text-right lg:border-l lg:pl-6 border-gray-200 dark:border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-white/60">
              Contact
            </h3>
            <div
              className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white"
              title="Primary phone"
            >
              {phoneDisplay}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 lg:justify-end">
              <LeadStatusBadge status={headerStatus} size="lg" />
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ${stageDisplay.pillClass}`}
              >
                <StageIcon
                  state={stageDisplay.state}
                  className="h-4 w-4"
                />
                {stageDisplay.label}
              </span>
            </div>
            <div className="mt-3 flex flex-col items-end gap-2 lg:items-end">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1.5 text-sm font-semibold text-amber-800 dark:bg-amber-400/20 dark:text-amber-200">
                <Clock3 className="h-4 w-4" />
                <span className="text-xs uppercase">Aging</span>
                <span>{agingDisplay}</span>
              </div>
              <div className="text-right text-xs text-gray-500 dark:text-white/60">
                <div className="uppercase tracking-wide">Entered on</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {enteredOnRaw ? formatDateDisplay(enteredOnRaw) : "Not set"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio row (Remark card removed) */}
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
          <HoverPreviewCard
            label="Bio"
            text={lead.bioText ?? ""}
            onViewMore={bioModal.openModal}
          />
        </div>
      </div>

      {/* --- MODALS (Unchanged logic, updated sizes) --- */}
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add phone</h3>
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
 * Helper icon for the stage badge.
 * (Slightly modified to not rely on props)
 */
function StageIcon({ state, className }: { state: string; className:string }) {
  if (state === "pending") {
    return <Clock3 className={className} />;
  }
  if (state === "revisit") {
    return <RefreshCcw className={className} />;
  }
  return <CheckCircle2 className={className} />;
}

/* ------------------------------ Local UI --------------------------------- */

/**
 * Hover preview card for Remark and Bio.
 * (Updated sizes)
 */
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
      className="relative rounded-2xl border border-gray-100 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/[0.03]"
      whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-white/60">{label}</div>
        <button
          type="button"
          onClick={onViewMore}
          className="inline-flex items-center rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:text-gray-200 dark:hover:border-emerald-300"
        >
          View
        </button>
      </div>
      <div className={`mt-2 line-clamp-2 whitespace-pre-wrap text-base ${empty ? "text-gray-400 dark:text-white/40" : "text-gray-800 dark:text-white/80"}`}>
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

/**
 * Modal for showing full Remark/Bio text.
 * (Updated sizes)
 */
function RemarkBioModal({ title, isOpen, onClose, body }: { title: string; isOpen: boolean; onClose: () => void; body: string }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[720px] m-4">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap text-base text-gray-800 dark:text-white/80">
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
