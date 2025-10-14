import { useLocation, useParams } from "react-router-dom";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

import { useAuth } from "@/context/AuthContex";
import {
  LEAD_DETAIL_WITH_TIMELINE,
  UPDATE_LEAD_STATUS,
  CHANGE_STAGE,
  CREATE_LEAD_EVENT,
} from "./gql/view_lead.gql";

import LeadProfileHeader from "./LeadProfileHeader";
import StatusCard from "./StatusCard";
import AddEventCard from "./AddEventCard";
import TimelineList from "./TimelineList";
import { pickLeadStage, pickLeadStatus } from "./interface/utils";
import type { LeadEvent, LeadProfile } from "./interface/types";

type LeadDetailResp = { leadDetailWithTimeline: LeadProfile };
type LeadDetailVars = { leadId: string; eventsLimit?: number };

export default function ViewLead() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const passedLead = (location.state as { lead?: Partial<LeadProfile> } | null)?.lead;

  const leadId = useMemo(() => {
    if (typeof id === "string" && id.trim()) return id;
    if (passedLead?.id) return String(passedLead.id);
    return "";
  }, [id, passedLead?.id]);

  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const canEditProfile = isAdmin || user?.role === "RM";

  const { data, loading, error, refetch } = useQuery<LeadDetailResp, LeadDetailVars>(
    LEAD_DETAIL_WITH_TIMELINE,
    { variables: { leadId, eventsLimit: 100 }, skip: !leadId, fetchPolicy: "cache-and-network" }
  );

  const [mutUpdateStatus] = useMutation(UPDATE_LEAD_STATUS);
  const [mutChangeStage] = useMutation(CHANGE_STAGE);
  const [mutCreateEvent, { loading: creatingEvent }] = useMutation(CREATE_LEAD_EVENT);

  const lead = data?.leadDetailWithTimeline;

  const events: LeadEvent[] = useMemo(
    () => (lead?.events ?? []).slice().sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)),
    [lead?.events]
  );

  const [statusValue, setStatusValue] = useState<string | undefined>(lead?.status as string | undefined);
  const [stageValue, setStageValue] = useState<string | undefined>(lead?.clientStage as string | undefined);

  useEffect(() => {
    setStatusValue(lead?.status as string | undefined);
    setStageValue(lead?.clientStage as string | undefined);
  }, [lead?.status, lead?.clientStage]);

  const handleStatusChange = async (next: string) => {
    if (!leadId) return;
    try {
      await mutUpdateStatus({ variables: { leadId, status: next } });
      toast.success("Status updated");
      await refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  const handleStageChange = async (next: string) => {
    if (!leadId) return;
    try {
      await mutChangeStage({
        variables: {
          input: {
            leadId,
            stage: next,
            note: null,
            channel: null,
            nextFollowUpAt: null,
            productExplained: null,
          },
        },
      });
      toast.success("Stage updated");
      await refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to update stage");
    }
  };

  const [eventType, setEventType] = useState<string>("NOTE");
  const [note, setNote] = useState("");
  const [followUpOn, setFollowUpOn] = useState("");
  const [channel, setChannel] = useState<string>("");
  const [outcome, setOutcome] = useState<string>("");
  const [reactivateToStage, setReactivateToStage] = useState<string | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  const handleCreateEventEnhanced = async () => {
    if (!leadId) return;
    const text = note.trim();
    if (!text) {
      toast.warn("Add a note before saving");
      return;
    }
    const nextFollowUpAt =
      followUpOn && !isNaN(Date.parse(followUpOn)) ? new Date(followUpOn).toISOString() : undefined;

    try {
      // If reactivation chosen, move stage first
      if (reactivateToStage && reactivateToStage !== stageValue) {
        await mutChangeStage({
          variables: {
            input: {
              leadId,
              stage: reactivateToStage,
              note: "Reactivated via new activity",
              channel: channel || null,
              nextFollowUpAt: nextFollowUpAt ?? null,
              productExplained: null,
            },
          },
        });
      }

      await mutCreateEvent({
        variables: {
          input: {
            leadId,
            type: eventType,
            text,
            tags: [eventType, "MANUAL_ENTRY"],
            channel: channel || null,
            outcome: outcome || null,
            nextFollowUpAt,
            dormantReason: null,
          },
        },
      });
      toast.success("Event logged");
      setEventType("NOTE");
      setNote("");
      setFollowUpOn("");
      setChannel("");
      setOutcome("");
      setReactivateToStage(null);
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
        lead={lead as any}
        loading={loading}
        isAdmin={isAdmin}
        canEditProfile={canEditProfile}
        onProfileRefresh={() => refetch()}
      />

      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,420px),minmax(0,1fr)]">
          <StatusCard
            statusValue={pickLeadStatus<string>(lead.status)}
            stageValue={pickLeadStage(lead.clientStage as any) as any}
            onStatusChange={handleStatusChange}
            onStageChange={handleStageChange}
            onStatusStageChange={async ({ newStatus, newStage, dormantReason }) => {
              if (!newStatus && !newStage) return;
              setUpdatingProgress(true);
              try {
                if (newStatus) await handleStatusChange(newStatus);
                if (newStage) {
                  await mutChangeStage({
                    variables: {
                      input: {
                        leadId,
                        stage: newStage,
                        note: dormantReason ? `Dormant reason: ${dormantReason}` : null,
                        channel: null,
                        nextFollowUpAt: null,
                        productExplained: null,
                      },
                    },
                  });
                  toast.success("Stage updated");
                  await refetch();
                }
              } catch (err: any) {
                toast.error(err.message || "Unable to update");
              } finally {
                setUpdatingProgress(false);
              }
            }}
            disabled={loading || updatingProgress}
            saving={updatingProgress}
          />
          <AddEventCard
            form={{
              type: eventType as any,
              note,
              followUpOn,
              channel,
              outcome,
              reactivateToStage,
            }}
            onChange={(f) => {
              setEventType(f.type);
              setNote(f.note);
              setFollowUpOn(f.followUpOn);
              setChannel(f.channel ?? "");
              setOutcome(f.outcome ?? "");
              setReactivateToStage(f.reactivateToStage ?? null);
            }}
            onCreateEvent={() => handleCreateEventEnhanced()}
            submitting={creatingEvent}
            currentStage={stageValue ?? null}
          />
        </div>

        <TimelineList events={events} />
      </div>
    </div>
  );
}

