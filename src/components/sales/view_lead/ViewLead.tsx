import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, AlertCircle, Users } from "lucide-react";
import { toast } from "react-toastify";

import { useAuth } from "@/context/AuthContex";
  import {
    LEAD_DETAIL_WITH_TIMELINE,
    UPDATE_LEAD_STATUS,
    CHANGE_STAGE,
    CREATE_LEAD_EVENT,
    RM_FIRST_CONTACT,
    UPDATE_LEAD_REMARK,
  } from "./gql/view_lead.gql";

import LeadProfileHeader from "./LeadProfileHeader";
import LeadUnifiedUpdateCard from "./LeadUnifiedUpdateCard";
import TimelineList from "./TimelineList";
import { pickLeadStage, pickLeadStatus } from "./interface/utils";
import { shouldAutoOpenLead } from "./autoStatus";
import type { LeadEvent, LeadProfile } from "./interface/types";
import RmLeadsDrawer from "./RmLeadsDrawer";

type LeadDetailResp = { leadDetailWithTimeline: LeadProfile };
type LeadDetailVars = { leadId: string; eventsLimit?: number };

export default function ViewLead() {
  const navigate = useNavigate();
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
  const [mutRmFirstContact] = useMutation(RM_FIRST_CONTACT);
  const [mutUpdateRemark] = useMutation(UPDATE_LEAD_REMARK);

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
      await mutUpdateStatus({
        variables: { leadId, status: next },
        update(cache, result) {
          const payload = (result?.data as any)?.updateLeadStatus;
          if (!payload?.id) return;
          cache.modify({
            id: cache.identify({ __typename: "IpkLeaddEntity", id: payload.id }),
            fields: {
              status: () => payload.status,
              clientStage: () => payload.clientStage,
              ...(payload.leadCode ? { leadCode: () => payload.leadCode } : {}),
            },
          });
        },
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
        update(cache, result) {
          const payload = (result?.data as any)?.changeStage;
          if (!payload?.id) return;
          cache.modify({
            id: cache.identify({ __typename: "IpkLeaddEntity", id: payload.id }),
            fields: {
              clientStage: () => payload.clientStage,
              approachAt: () => payload.approachAt,
              lastSeenAt: () => payload.lastSeenAt,
              ...(payload.leadCode ? { leadCode: () => payload.leadCode } : {}),
            },
          });
        },
      });

      // Auto-open rule for simple stage dropdown as well.
      if (
        shouldAutoOpenLead({
          previousStatus: lead?.status as string | null,
          nextStage: next,
        })
      ) {
        try {
          await mutUpdateStatus({
            variables: { leadId, status: "OPEN" },
            update(cache, result) {
              const payload = (result?.data as any)?.updateLeadStatus;
              if (!payload?.id) return;
              cache.modify({
                id: cache.identify({ __typename: "IpkLeaddEntity", id: payload.id }),
                fields: {
                  status: () => payload.status,
                  clientStage: () => payload.clientStage,
                  ...(payload.leadCode ? { leadCode: () => payload.leadCode } : {}),
                },
              });
            },
          });
        } catch (e) {
          // non-blocking; ignore auto-open failures
        }
      }

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
  const [isRmDrawerOpen, setRmDrawerOpen] = useState(false);

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
      // Keep the Latest remark in sync with the newest note
      try {
        await mutUpdateRemark({ variables: { input: { leadId, remark: text } } });
      } catch (_) {
        // non-blocking; ignore failures
      }
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
    <>
    <div className="space-y-6">
      <LeadProfileHeader
        lead={lead as any}
        loading={loading}
        isAdmin={isAdmin}
        canEditProfile={canEditProfile}
        onProfileRefresh={() => refetch()}
      />

      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="h-full min-h-0">
            <LeadUnifiedUpdateCard
              leadId={leadId}
              currentStatus={(lead.stageFilter as any) ?? (pickLeadStatus<string>(lead.status) as any)}
              currentStage={pickLeadStage(lead.clientStage as any) as any}
              pipelineStatus={lead.status as any}
              onSaved={() => refetch()}
            />
          </div>
          <div className="h-full min-h-0">
            <TimelineList events={events} />
          </div>
        </div>
      </div>
    </div>
    {/* Floating trigger (desktop) */}
    <div className="fixed right-6 top-28 z-[60] hidden md:block">
      <button
        onClick={() => setRmDrawerOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-white/80 dark:ring-white/10"
        title="View all my leads"
      >
        <Users className="h-4 w-4 text-brand-600" />
        <span>My Leads</span>
      </button>
    </div>

    {/* Floating trigger (mobile / tablet) */}
    <div className="fixed bottom-6 right-4 z-[60] md:hidden">
      <button
        onClick={() => setRmDrawerOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-brand-700/20"
        title="My Leads"
        aria-label="Open my leads"
      >
        <Users className="h-5 w-5 text-white" />
        <span className="sr-only">My Leads</span>
      </button>
    </div>

    {/* Right-side drawer */}
    <RmLeadsDrawer
      isOpen={isRmDrawerOpen}
      onClose={() => setRmDrawerOpen(false)}
      onPick={(l) => {
        setRmDrawerOpen(false);
        if (l.id) {
          navigate(`/sales/leads/${l.id}`, { state: { lead: { id: l.id, leadCode: l.leadCode, name: l.name } } });
        }
      }}
    />
    </>
  );
}


