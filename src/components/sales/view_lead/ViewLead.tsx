import { useLocation, useParams } from "react-router-dom";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

import { useAuth } from "@/context/AuthContex";
import {
  LEAD_DETAIL_WITH_TIMELINE,
  UPDATE_LEAD_PROGRESS,
  CREATE_LEAD_EVENT,
} from "@/core/graphql/lead/lead.gql";

import LeadProfileHeader from "./LeadProfileHeader";
import StatusCard from "./StatusCard";
import AddEventCard from "./AddEventCard";
import TimelineRow from "./TimelineRow";
import { pickLeadStage, pickLeadStatus } from "./interface/utils";

import type { LeadProfile, TimelineEvent, EventFormState } from "./interface/types";

type LeadDetailQueryResult = {
  lead: any | null;
  leadEvents: TimelineEvent[];
};
type LeadDetailQueryVariables = { id: string };

export default function ViewLead() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const passedLead = (location.state as { lead?: any } | null)?.lead;

  const leadId = useMemo(() => {
    if (typeof id === "string" && id.trim()) return id;
    if (passedLead?.id) return String(passedLead.id);
    return "";
  }, [id, passedLead?.id]);

  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const canEditProfile = isAdmin || user?.role === "RM";

  const { data, loading, error, refetch } = useQuery<
    LeadDetailQueryResult,
    LeadDetailQueryVariables
  >(LEAD_DETAIL_WITH_TIMELINE, {
    variables: { id: leadId },
    skip: !leadId,
    fetchPolicy: "cache-and-network",
  });

  const [updateLeadProgress, { loading: updatingProgress }] = useMutation(
    UPDATE_LEAD_PROGRESS
  );
  const [createLeadEvent, { loading: creatingEvent }] = useMutation(
    CREATE_LEAD_EVENT
  );

  const lead: LeadProfile | null = useMemo(() => {
    const node = data?.lead ?? passedLead;
    if (!node) return null;

    const name =
      node.name ||
      `${node.firstName ?? ""} ${node.lastName ?? ""}`.trim() ||
      "Unnamed lead";

    const rawClientStage = node.clientStage ?? null;
    const normalizedStage =
      pickLeadStage(rawClientStage) ?? pickLeadStage(node.status);

    const enteredAt: string | null =
      node.createdAt ?? node.firstSeenAt ?? null;
    const agingDays =
      enteredAt && !Number.isNaN(Date.parse(enteredAt))
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - Date.parse(enteredAt)) / (1000 * 60 * 60 * 24),
            ),
          )
        : null;
    const sipAmount =
      node.sipAmount === null || node.sipAmount === undefined
        ? null
        : Number.isFinite(Number(node.sipAmount))
        ? Number(node.sipAmount)
        : null;

    return {
      id: leadId,
      name,
      firstName: node.firstName ?? null,
      lastName: node.lastName ?? null,
      leadCode: node.leadCode ?? null,
      email: node.email ?? null,
      phone: node.phone ?? null,
      mobile: node.mobile ?? null,
      phones: node.phones ?? [],
      location: node.location ?? node.city ?? null,
      leadSource: node.leadSource ?? null,
      product: node.product ?? null,
      investmentRange: node.investmentRange ?? null,
      designation: node.designation ?? null,
      profession: node.profession ?? null,
      companyName: node.companyName ?? null,
      referralName: node.referralName ?? null,
      referralCode: node.referralCode ?? null,
      status: pickLeadStatus<string>(node.status),
      clientStage: normalizedStage,
      clientStageRaw: rawClientStage,
      clientTypes: node.clientTypes ?? null,
      sipAmount,
      gender: node.gender ?? null,
      enteredAt,
      agingDays,
      remark: node.remark ?? null,
      assignedRm: node.assignedRM ?? null,
      assignedRmDetails: node.assignedRmDetails ?? null,
      createdAt: node.createdAt ?? null,
      updatedAt: node.updatedAt ?? null,
      lastContactedAt: node.lastContactedAt ?? null,
      revisitCount: node.revisitCount ?? 0,
    };
  }, [data?.lead, passedLead, leadId]);

  const events: TimelineEvent[] = useMemo(() => {
    const list = data?.leadEvents ?? [];
    return list.slice().sort(
      (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)
    );
  }, [data?.leadEvents]);

  const [statusValue, setStatusValue] = useState<string | undefined>(
    lead?.status === "ASSIGNED" ? "PENDING" : lead?.status
  );
  const [stageValue, setStageValue] = useState<string | undefined>(
    lead?.clientStage ?? undefined
  );
  const [eventForm, setEventForm] = useState<EventFormState>({
    type: "NOTE",
    note: "",
    followUpOn: "",
  });

  useEffect(() => {
    setStatusValue(
      lead?.status === "ASSIGNED" ? "PENDING" : lead?.status
    );
    setStageValue(lead?.clientStage ?? undefined);
  }, [lead?.status, lead?.clientStage]);

  const handleStatusChange = async (next: string) => {
    if (!leadId) return;
    try {
      await updateLeadProgress({
        variables: { id: leadId, input: { status: next } },
      });
      toast.success("Status updated");
      await refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  const handleStageChange = async (next: string) => {
    if (!leadId) return;
    try {
      await updateLeadProgress({
        variables: { id: leadId, input: { clientStage: next } },
      });
      toast.success("Stage updated");
      await refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to update stage");
    }
  };

  const handleCreateEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!leadId) return;
    const note = eventForm.note.trim();
    if (!note) {
      toast.warn("Add a note before saving");
      return;
    }
    const followUpOn =
      eventForm.followUpOn && !isNaN(Date.parse(eventForm.followUpOn))
        ? new Date(eventForm.followUpOn).toISOString()
        : undefined;
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
      toast.success("Event logged");
      setEventForm({ type: "NOTE", note: "", followUpOn: "" });
      await refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to log event");
    }
  };

  if (!leadId) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm">Missing lead id.</div>;
  }
  if (loading && !lead) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-sm">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" /> Loading lead details...
      </div>
    );
  }
  if (error && !lead) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-4 w-4" /> Unable to load this lead.
        </div>
        <div className="mt-2 text-xs opacity-80">{error.message}</div>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!lead) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm">Lead not found.</div>;
  }

  return (
    <div className="space-y-6">
      <LeadProfileHeader
        lead={lead}
        loading={loading}
        isAdmin={isAdmin}
        canEditProfile={canEditProfile}
        onProfileRefresh={() => refetch()}
      />

      <div className="grid gap-6 lg:grid-cols-[320px,minmax(0,1fr)]">
        <aside className="flex flex-col gap-6">
          <StatusCard
            statusValue={statusValue as any}
            stageValue={stageValue as any}
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
            <h2 className="text-base font-semibold">Activity timeline</h2>
            <span className="text-xs text-gray-400">{events.length} entries</span>
          </div>
          <div className="mt-4 space-y-6">
            {events.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-sm text-gray-500">
                No events recorded yet. Log a call or note to begin history.
              </div>
            )}
            {events.map((ev) => (
              <TimelineRow key={ev.id} event={ev} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
