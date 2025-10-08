import { useLocation, useParams } from "react-router-dom";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  AlertCircle,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  NotebookPen,
  Package,
  PencilLine,
  PhoneCall,
  PlusCircle,
  UserCircle2,
  UserPlus,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "react-toastify";

import { useAuth } from "@/context/AuthContex";

import LeadStatusBadge from "@/components/sales/myleads/LeadStatusBadge";
import { LeadStage, LeadStatus } from "@/components/sales/myleads/interface/type";
import { STAGE_META } from "@/components/sales/myleads/stageMeta";
import {
  CREATE_LEAD_EVENT,
  LEAD_DETAIL_WITH_TIMELINE,
  UPDATE_LEAD_PROGRESS,
} from "@/core/graphql/lead/lead.gql";
import type { Lead } from "@/components/sales/myleads/interface/type";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: LeadStatus.PENDING, label: "Pending" },
  { value: LeadStatus.OPEN, label: "Open" },
  { value: LeadStatus.IN_PROGRESS, label: "In progress" },
  { value: LeadStatus.ON_HOLD, label: "On hold" },
  { value: LeadStatus.CLOSED, label: "Closed" },
  { value: LeadStatus.LOST, label: "Lost" },
];

const EVENT_OPTIONS: { value: LeadEventType; label: string }[] = [
  { value: "NOTE", label: "Note" },
  { value: "CALL", label: "Phone call" },
  { value: "MEETING", label: "Meeting" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INTERACTION", label: "Interaction" },
];

type LeadDetailQueryResult = {
  lead: LeadDetailNode | null;
  leadEvents: LeadEventNode[];
};

type LeadDetailQueryVariables = {
  id: string;
};

type LeadDetailNode = {
  id: string;
  leadCode?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  location?: string | null;
  city?: string | null;
  leadSource?: string | null;
  status?: string | null;
  clientStage?: string | null;
  remark?: string | null;
  assignedRM?: string | null;
  assignedRmDetails?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  product?: string | null;
  investmentRange?: string | null;
  designation?: string | null;
  referralName?: string | null;
  referralCode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastContactedAt?: string | null;
};

type LeadEventNode = {
  id: string;
  type: string;
  occurredAt: string;
  note?: string | null;
  summary?: string | null;
  prevStatus?: string | null;
  nextStatus?: string | null;
  prevStage?: string | null;
  nextStage?: string | null;
  followUpOn?: string | null;
  createdAt?: string | null;
  author?: {
    id: string;
    name: string;
    initials?: string | null;
    avatarUrl?: string | null;
  } | null;
};

type LeadEventType =
  | "NOTE"
  | "CALL"
  | "MEETING"
  | "WHATSAPP"
  | "INTERACTION"
  | "STATUS_CHANGE"
  | "STAGE_CHANGE"
  | "ASSIGNMENT"
  | string;

type EventFormState = {
  type: LeadEventType;
  note: string;
  followUpOn: string;
};

type TimelineEvent = {
  id: string;
  type: LeadEventType;
  occurredAt: string;
  note?: string | null;
  summary?: string | null;
  followUpOn?: string | null;
  authorName?: string | null;
  authorInitials?: string | null;
  prevStatus?: string | null;
  nextStatus?: string | null;
  prevStage?: string | null;
  nextStage?: string | null;
};

export default function ViewLead() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const passedLead = (location.state as { lead?: Lead } | null)?.lead;

  const leadId = useMemo(() => {
    if (typeof id === "string" && id.trim().length > 0) return id;
    if (passedLead?.id) return String(passedLead.id);
    return "";
  }, [id, passedLead?.id]);

  const { user } = useAuth();
  const viewerRole = user?.role ?? "UNKNOWN";
  const isAdmin = viewerRole === "ADMIN";
  const canEditProfile = isAdmin || viewerRole === "RM";

  const { data, loading, error, refetch } = useQuery<LeadDetailQueryResult, LeadDetailQueryVariables>(
    LEAD_DETAIL_WITH_TIMELINE,
    {
      variables: { id: leadId },
      skip: !leadId,
      fetchPolicy: "cache-and-network",
    },
  );

  const [updateLeadProgress, { loading: updatingProgress }] = useMutation(UPDATE_LEAD_PROGRESS);
  const [createLeadEvent, { loading: creatingEvent }] = useMutation(CREATE_LEAD_EVENT);

  const normalizedLead = useMemo(() => {
    const merged: LeadDetailNode | null = data?.lead ?? null;
    if (!merged && !passedLead) return null;

    const baseName =
      merged?.name ??
      passedLead?.name ??
      [merged?.firstName ?? passedLead?.name ?? "", merged?.lastName ?? ""]
        .join(" ")
        .trim();
    const name = baseName && baseName.length > 0 ? baseName : "Unnamed lead";

    const stage = pickLeadStage(merged?.clientStage ?? passedLead?.clientStage ?? passedLead?.status);
    const status = pickLeadStatus(merged?.status ?? passedLead?.status);

    return {
      id: leadId,
      name,
      leadCode: merged?.leadCode ?? passedLead?.leadCode ?? null,
      email: merged?.email ?? passedLead?.email ?? null,
      phone: merged?.phone ?? passedLead?.mobile ?? passedLead?.phone ?? null,
      mobile: merged?.mobile ?? passedLead?.mobile ?? null,
      location: merged?.location ?? merged?.city ?? passedLead?.location ?? null,
      leadSource: merged?.leadSource ?? passedLead?.leadSource ?? null,
      product: merged?.product ?? passedLead?.product ?? null,
      investmentRange: merged?.investmentRange ?? null,
      designation: merged?.designation ?? null,
      referralName: merged?.referralName ?? null,
      referralCode: merged?.referralCode ?? null,
      status,
      clientStage: stage,
      remark: merged?.remark ?? passedLead?.remark ?? null,
      assignedRm: merged?.assignedRM ?? passedLead?.assignedRm ?? null,
      assignedRmDetails: merged?.assignedRmDetails ?? null,
      createdAt: merged?.createdAt ?? null,
      updatedAt: merged?.updatedAt ?? null,
      lastContactedAt: merged?.lastContactedAt ?? passedLead?.lastContactedAt ?? null,
    } satisfies LeadProfile;
  }, [data?.lead, passedLead, leadId]);

  const events = useMemo<TimelineEvent[]>(() => {
    const source = data?.leadEvents ?? [];
    return source
      .map((event) => ({
        id: event.id,
        type: event.type,
        occurredAt: event.occurredAt,
        note: event.note,
        summary: event.summary,
        followUpOn: event.followUpOn,
        authorName: event.author?.name ?? null,
        authorInitials: event.author?.initials ?? null,
        prevStatus: event.prevStatus ?? null,
        nextStatus: event.nextStatus ?? null,
        prevStage: event.prevStage ?? null,
        nextStage: event.nextStage ?? null,
      }))
      .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  }, [data?.leadEvents]);

  const [statusValue, setStatusValue] = useState<LeadStatus | undefined>(normalizedLead?.status);
  const [stageValue, setStageValue] = useState<LeadStage | undefined>(normalizedLead?.clientStage);
  const [eventForm, setEventForm] = useState<EventFormState>({ type: "NOTE", note: "", followUpOn: "" });

  useEffect(() => {
    setStatusValue(normalizedLead?.status);
    setStageValue(normalizedLead?.clientStage);
  }, [normalizedLead?.status, normalizedLead?.clientStage]);

  const handleEditField = (field: EditableLeadField) => {
    const label = FIELD_LABELS[field] ?? humanize(field);
    toast.info(`Update ${label} from the profile header`);
  };

  const handleStatusChange = async (next: string) => {
    if (!normalizedLead || !leadId) return;
    const previous = statusValue;
    const nextStatus = next as LeadStatus;
    setStatusValue(nextStatus);

    try {
      await updateLeadProgress({
        variables: {
          id: leadId,
          input: { status: nextStatus },
        },
      });
      toast.success("Lead status updated");
      await refetch();
    } catch (mutationError: any) {
      console.error(mutationError);
      toast.error(mutationError?.message ?? "Unable to update status");
      setStatusValue(previous);
    }
  };

  const handleStageChange = async (next: string) => {
    if (!normalizedLead || !leadId) return;
    const previous = stageValue;
    const nextStage = next as LeadStage;
    setStageValue(nextStage);

    try {
      await updateLeadProgress({
        variables: {
          id: leadId,
          input: { clientStage: nextStage },
        },
      });
      toast.success("Lead stage updated");
      await refetch();
    } catch (mutationError: any) {
      console.error(mutationError);
      toast.error(mutationError?.message ?? "Unable to update stage");
      setStageValue(previous);
    }
  };

  const handleCreateEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!leadId) return;

    const note = eventForm.note.trim();
    if (!note) {
      toast.warn("Add a note before saving");
      return;
    }

    let followUpOn: string | undefined;
    if (eventForm.followUpOn) {
      const timestamp = Date.parse(eventForm.followUpOn);
      if (!Number.isNaN(timestamp)) {
        followUpOn = new Date(timestamp).toISOString();
      }
    }

    try {
      await createLeadEvent({
        variables: {
          input: {
            leadId,
            type: eventForm.type,
            note,
            followUpOn,
          },
        },
      });
      toast.success("Timeline updated");
      setEventForm({ type: "NOTE", note: "", followUpOn: "" });
      await refetch();
    } catch (mutationError: any) {
      console.error(mutationError);
      toast.error(mutationError?.message ?? "Unable to log event");
    }
  };

  if (!leadId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
        Missing lead id. Use the Assigned Leads list to open a lead profile.
      </div>
    );
  }

  if (loading && !normalizedLead) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-sm font-medium text-gray-500 dark:text-white/70">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" aria-hidden="true" />
        Loading lead details...
      </div>
    );
  }

  if (error && !normalizedLead) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-4 w-4" /> Unable to load this lead.
        </div>
        <div className="mt-2 text-xs opacity-80">{error.message}</div>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!normalizedLead) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
        We could not locate that lead. It might have been removed.
      </div>
    );
  }

  const stageMeta = normalizedLead.clientStage ? STAGE_META[normalizedLead.clientStage] : null;

  return (
    <div className="space-y-6">
      <LeadProfileHeader
        lead={normalizedLead}
        stageMeta={stageMeta}
        loading={loading}
        isAdmin={isAdmin}
        canEditProfile={canEditProfile}
        onEditField={handleEditField}
      />

      <div className="grid gap-6 lg:grid-cols-[320px,minmax(0,1fr)]">
        <aside className="flex flex-col gap-6">
          <StatusCard
            statusValue={statusValue}
            stageValue={stageValue}
            onStatusChange={handleStatusChange}
            onStageChange={handleStageChange}
            disabled={updatingProgress}
          />

          <AddEventCard
            form={eventForm}
            onChange={setEventForm}
            onSubmit={handleCreateEvent}
            submitting={creatingEvent}
          />
        </aside>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Activity timeline</h2>
            <span className="text-xs text-gray-400">{events.length} entries</span>
          </div>
          <div className="mt-4 space-y-6">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/70">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" aria-hidden="true" />
                Updating timeline...
              </div>
            )}

            {!loading && events.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-sm text-gray-500 dark:border-white/20 dark:bg-white/[0.04] dark:text-white/60">
                No events recorded yet. Log a call or note to begin the history.
              </div>
            )}

            {events.map((event) => (
              <TimelineRow key={event.id} event={event} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

type EditableLeadField =
  | "email"
  | "phone"
  | "location"
  | "product"
  | "investmentRange"
  | "designation"
  | "referral"
  | "assignedRm";

const FIELD_LABELS: Record<EditableLeadField, string> = {
  email: "Email",
  phone: "Mobile number",
  location: "Location",
  product: "Product",
  investmentRange: "Investment range",
  designation: "Designation",
  referral: "Referral person",
  assignedRm: "Assigned RM",
};

type LeadProfile = {
  id: string;
  name: string;
  leadCode: string | null | undefined;
  email: string | null | undefined;
  phone: string | null | undefined;
  mobile: string | null | undefined;
  location: string | null | undefined;
  leadSource: string | null | undefined;
  product?: string | null;
  investmentRange?: string | null;
  designation?: string | null;
  referralName?: string | null;
  referralCode?: string | null;
  status?: LeadStatus;
  clientStage?: LeadStage;
  remark?: string | null;
  assignedRm?: string | null;
  assignedRmDetails?: LeadDetailNode["assignedRmDetails"];
  createdAt?: string | null;
  updatedAt?: string | null;
  lastContactedAt?: string | null;
};

type LeadProfileHeaderProps = {
  lead: LeadProfile;
  stageMeta: (typeof STAGE_META)[LeadStage] | null;
  loading: boolean;
  isAdmin: boolean;
  canEditProfile: boolean;
  onEditField: (field: EditableLeadField) => void;
};

function LeadProfileHeader({ lead, stageMeta, loading, isAdmin, canEditProfile, onEditField }: LeadProfileHeaderProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-xl font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
            {initials(lead.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{lead.name}</h1>
              <LeadStatusBadge status={lead.status} size="md" />
              {stageMeta && (
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${stageMeta.pillClass}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {stageMeta.label}
                </span>
              )}
            </div>
            <LeadMeta
              lead={lead}
              loading={loading}
              isAdmin={isAdmin}
              canEdit={canEditProfile}
              onEditField={onEditField}
            />
          </div>
        </div>
        {lead.leadCode && (
          <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100">
            Lead code: {lead.leadCode}
          </div>
        )}
      </div>
      {lead.remark && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
          <span className="font-semibold text-gray-900 dark:text-white">Latest remark:</span> {lead.remark}
        </div>
      )}
    </div>
  );
}

type LeadMetaProps = {
  lead: LeadProfile;
  loading: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  onEditField: (field: EditableLeadField) => void;
};

function LeadMeta({ lead, loading, isAdmin, canEdit, onEditField }: LeadMetaProps) {
  const showReferral = (lead.leadSource ?? "").toLowerCase() === "referral";
  const referralValue =
    lead.referralName?.trim() || lead.referralCode?.trim() || "No referral provided";

  type MetaRow = {
    key: string;
    icon: typeof Mail;
    label: string;
    value: string;
    field?: EditableLeadField;
    editable?: boolean;
    visible?: boolean;
  };

  const rows: MetaRow[] = [
    {
      key: "email",
      icon: Mail,
      label: "Email",
      value: lead.email ?? "No email",
      field: "email",
      editable: canEdit,
    },
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
    {
      key: "assignedRm",
      icon: UserRound,
      label: "Assigned RM",
      value: lead.assignedRmDetails?.name ?? lead.assignedRm ?? "Unassigned",
      field: "assignedRm",
      editable: isAdmin,
      visible: isAdmin,
    },
    {
      key: "product",
      icon: Package,
      label: "Product",
      value: lead.product?.trim() || "Not specified",
      field: "product",
      editable: canEdit,
    },
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
      field: "referral",
      editable: canEdit,
      visible: showReferral,
    },
    {
      key: "lastContact",
      icon: Clock,
      label: "Last contact",
      value: lead.lastContactedAt
        ? `Last contact ${formatRelative(lead.lastContactedAt)}`
        : "No contact logged",
    },
  ];

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {rows
        .filter((row) => row.visible !== false)
        .map(({ key, icon: Icon, label, value, field, editable }) => (
          <div
            key={key}
            className={`flex items-center gap-2 rounded-xl border border-gray-100 bg-white/70 px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 ${loading ? "opacity-70" : ""}`}
          >
            <Icon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            <span className="truncate text-left text-sm font-medium text-gray-700 dark:text-white/70" title={value}>
              {value}
            </span>
            {editable && field && (
              <button
                type="button"
                onClick={() => onEditField(field)}
                className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-gray-400 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-200 dark:text-white/40 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200"
                title={`Edit ${label.toLowerCase()}`}
              >
                <PencilLine className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Edit {label}</span>
              </button>
            )}
          </div>
        ))}
    </div>
  );
}

type StatusCardProps = {
  statusValue?: LeadStatus;
  stageValue?: LeadStage;
  onStatusChange: (value: string) => void;
  onStageChange: (value: string) => void;
  disabled?: boolean;
};

function StatusCard({ statusValue, stageValue, onStatusChange, onStageChange, disabled }: StatusCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex items-center gap-2">
        <UserRoundCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Update progress</h3>
      </div>

      <div className="mt-4 space-y-4">
        <fieldset>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/60">Lead status</label>
          <select
            value={statusValue ?? ""}
            onChange={(event) => onStatusChange(event.target.value)}
            disabled={disabled}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
          >
            <option value="" disabled>
              Select status
            </option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/60">Pipeline stage</label>
          <select
            value={stageValue ?? ""}
            onChange={(event) => onStageChange(event.target.value)}
            disabled={disabled}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
          >
            <option value="" disabled>
              Select stage
            </option>
            {Object.entries(STAGE_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </fieldset>
      </div>
    </div>
  );
}

type AddEventCardProps = {
  form: EventFormState;
  onChange: (state: EventFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitting?: boolean;
};

function AddEventCard({ form, onChange, onSubmit, submitting }: AddEventCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex items-center gap-2">
        <PlusCircle className="h-5 w-5 text-emerald-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Log activity</h3>
      </div>

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <fieldset>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/60">Event type</label>
          <select
            value={form.type}
            onChange={(event) => onChange({ ...form, type: event.target.value as LeadEventType })}
            disabled={submitting}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
          >
            {EVENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/60">Notes</label>
          <textarea
            value={form.note}
            onChange={(event) => onChange({ ...form, note: event.target.value })}
            rows={4}
            placeholder="Add call summary, commitments, objections..."
            disabled={submitting}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
          />
        </fieldset>

        <fieldset>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/60">Next follow-up</label>
          <input
            type="datetime-local"
            value={form.followUpOn}
            onChange={(event) => onChange({ ...form, followUpOn: event.target.value })}
            disabled={submitting}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
          />
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-hidden focus:ring-4 focus:ring-emerald-200 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Saving...
            </>
          ) : (
            <>
              <NotebookPen className="h-4 w-4" aria-hidden="true" />
              Log event
            </>
          )}
        </button>
      </form>
    </div>
  );
}

type TimelineRowProps = {
  event: TimelineEvent;
};

function TimelineRow({ event }: TimelineRowProps) {
  const Icon = eventIcon(event.type);
  return (
    <div className="flex gap-3">
      <div className="mt-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 dark:text-white/50">
          <span className="font-medium text-gray-600 dark:text-white/70">{formatEventType(event.type)}</span>
          <span>•</span>
          <span>{formatEventTimestamp(event.occurredAt)}</span>
          {event.authorName && (
            <>
              <span>•</span>
              <span>{event.authorName}</span>
            </>
          )}
        </div>
        <div className="mt-1 text-sm text-gray-800 dark:text-white/80">
          {renderEventSummary(event)}
        </div>
        {event.note && (
          <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/70 p-3 text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
            {event.note}
          </div>
        )}
        {event.followUpOn && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            Follow-up {formatEventTimestamp(event.followUpOn)}
          </div>
        )}
      </div>
    </div>
  );
}

function renderEventSummary(event: TimelineEvent) {
  if (event.type === "STATUS_CHANGE" && event.prevStatus && event.nextStatus) {
    return `Status changed from ${humanize(event.prevStatus)} to ${humanize(event.nextStatus)}`;
  }
  if (event.type === "STAGE_CHANGE" && event.prevStage && event.nextStage) {
    const prev = STAGE_META[event.prevStage as LeadStage]?.label ?? humanize(event.prevStage);
    const next = STAGE_META[event.nextStage as LeadStage]?.label ?? humanize(event.nextStage);
    return `Stage moved from ${prev} to ${next}`;
  }
  if (event.summary) return event.summary;
  switch (event.type) {
    case "NOTE":
      return "Note added";
    case "CALL":
      return "Call logged";
    case "MEETING":
      return "Meeting recorded";
    case "WHATSAPP":
      return "WhatsApp follow-up";
    case "INTERACTION":
      return "Interaction captured";
    case "ASSIGNMENT":
      return "Lead assigned";
    default:
      return humanize(event.type ?? "event");
  }
}

function eventIcon(type: LeadEventType) {
  switch (type) {
    case "NOTE":
      return NotebookPen;
    case "CALL":
      return PhoneCall;
    case "MEETING":
      return UserCircle2;
    case "WHATSAPP":
      return MessageSquare;
    case "INTERACTION":
      return MessageSquare;
    case "STATUS_CHANGE":
      return CheckCircle2;
    case "STAGE_CHANGE":
      return UserRoundCheck;
    case "ASSIGNMENT":
      return UserRound;
    default:
      return NotebookPen;
  }
}

function formatEventType(type: string | undefined) {
  if (!type) return "Event";
  return humanize(type);
}

function formatEventTimestamp(value: string) {
  try {
    const date = parseISO(value);
    return `${format(date, "MMM d, yyyy • h:mm a")} (${formatDistanceToNow(date, { addSuffix: true })})`;
  } catch (error) {
    return value;
  }
}

function formatRelative(value?: string | null) {
  if (!value) return "";
  try {
    const date = parseISO(value);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return value;
  }
}

function formatInvestmentRange(value?: string | null) {
  if (!value) return "Not captured";
  return value;
}

function pickLeadStage(value?: string | null): LeadStage | undefined {
  if (!value) return undefined;
  if (value in STAGE_META) return value as LeadStage;
  return undefined;
}

function pickLeadStatus(value?: string | null): LeadStatus | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  const match = STATUS_OPTIONS.find((option) => option.value === upper);
  if (match) return match.value;
  return undefined;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

