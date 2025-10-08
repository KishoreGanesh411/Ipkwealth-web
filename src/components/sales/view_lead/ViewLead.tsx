import { useLocation, useParams } from "react-router-dom";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

import { useAuth } from "@/context/AuthContex";
import { STAGE_META } from "@/components/sales/myleads/stageMeta";
import { LeadStage, LeadStatus } from "@/components/sales/myleads/interface/type";

import {
  CREATE_LEAD_EVENT,
  LEAD_DETAIL_WITH_TIMELINE,
  UPDATE_LEAD_PROGRESS,
} from "@/core/graphql/lead/lead.gql";

import LeadProfileHeader from "./LeadProfileHeader";
import StatusCard from "./StatusCard";
import AddEventCard from "./AddEventCard";
import TimelineRow from "./TimelineRow";

import { pickLeadStage, pickLeadStatus } from "./utils";

import type { EventFormState, LeadProfile, TimelineEvent } from "./types";

// GraphQL result shapes (lightweight)
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

  const { data, loading, error, refetch } = useQuery<LeadDetailQueryResult, LeadDetailQueryVariables>(
    LEAD_DETAIL_WITH_TIMELINE,
    { variables: { id: leadId }, skip: !leadId, fetchPolicy: "cache-and-network" }
  );

  const [updateLeadProgress, { loading: updatingProgress }] = useMutation(UPDATE_LEAD_PROGRESS);
  const [createLeadEvent, { loading: creatingEvent }] = useMutation(CREATE_LEAD_EVENT);

  // normalize
  const lead: LeadProfile | null = useMemo(() => {
    const node = data?.lead ?? passedLead;
    if (!node) return null;

    const name =
      node.name ||
      `${node.firstName ?? ""} ${node.lastName ?? ""}`.trim() ||
      "Unnamed lead";

    return {
      id: leadId,
      name,
      leadCode: node.leadCode ?? null,
      email: node.email ?? null,
      phone: node.phone ?? null,
      mobile: node.mobile ?? null,
      location: node.location ?? node.city ?? null,
      leadSource: node.leadSource ?? null,
      product: node.product ?? null,
      investmentRange: node.investmentRange ?? null,
      designation: node.designation ?? null,
      referralName: node.referralName ?? null,
      referralCode: node.referralCode ?? null,
      status: pickLeadStatus<LeadStatus>(node.status),
      clientStage: pickLeadStage(node.clientStage ?? node.status),
      remark: node.remark ?? null,
      assignedRm: node.assignedRM ?? null,
      assignedRmDetails: node.assignedRmDetails ?? null,
      createdAt: node.createdAt ?? null,
      updatedAt: node.updatedAt ?? null,
      lastContactedAt: node.lastContactedAt ?? null,
    };
  }, [data?.lead, passedLead, leadId]);

  const events: TimelineEvent[] = useMemo(() => {
    const list = data?.leadEvents ?? [];
    return [...list].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  }, [data?.leadEvents]);

  // local state
  const [statusValue, setStatusValue] = useState<LeadStatus | undefined>(lead?.status);
  const [stageValue, setStageValue] = useState<LeadStage | undefined>(lead?.clientStage);
  const [eventForm, setEventForm] = useState<EventFormState>({ type: "NOTE", note: "", followUpOn: "" });

  useEffect(() => {
    setStatusValue(lead?.status);
    setStageValue(lead?.clientStage);
  }, [lead?.status, lead?.clientStage]);

  // handlers
  const handleStatusChange = async (next: string) => {
    if (!leadId) return;
    try {
      await updateLeadProgress({ variables: { id: leadId, input: { status: next } } });
      toast.success("Lead status updated");
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Unable to update status");
    }
  };

  const handleStageChange = async (next: string) => {
    if (!leadId) return;
    try {
      await updateLeadProgress({ variables: { id: leadId, input: { clientStage: next } } });
      toast.success("Lead stage updated");
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Unable to update stage");
    }
  };

  const handleCreateEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!leadId) return;

    const note = eventForm.note.trim();
    if (!note) return toast.warn("Add a note before saving");

    const followUpOn =
      eventForm.followUpOn && !Number.isNaN(Date.parse(eventForm.followUpOn))
        ? new Date(eventForm.followUpOn).toISOString()
        : undefined;

    try {
      await createLeadEvent({
        variables: { input: { leadId, type: eventForm.type, note, followUpOn } },
      });
      toast.success("Timeline updated");
      setEventForm({ type: "NOTE", note: "", followUpOn: "" });
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Unable to log event");
    }
  };

  // guards
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
        <div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" /> Unable to load this lead.</div>
        <div className="mt-2 text-xs opacity-80">{error.message}</div>
        <button onClick={() => refetch()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white">
          Retry
        </button>
      </div>
    );
  }
  if (!lead) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm">We could not locate that lead.</div>;
  }

  const stageMeta = lead.clientStage ? STAGE_META[lead.clientStage] : null;

  return (
    <div className="space-y-6">
      <LeadProfileHeader
        lead={lead}
        stageMeta={stageMeta}
        loading={loading}
        isAdmin={isAdmin}
        canEditProfile={canEditProfile}
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
          <AddEventCard form={eventForm} onChange={setEventForm} onSubmit={handleCreateEvent} submitting={creatingEvent} />
        </aside>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Activity timeline</h2>
            <span className="text-xs text-gray-400">{events.length} entries</span>
          </div>

          <div className="mt-4 space-y-6">
            {events.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-sm text-gray-500">
                No events recorded yet. Log a call or note to begin the history.
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
