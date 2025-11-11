// Lead Profile Page
//
// Managers get a consistent snapshot of the lead at the top, can change the
// current stage inline, and log follow-up notes/events without leaving the page.
// New events appear instantly via Apollo cache updates.

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ApolloError, useMutation, useQuery } from "@apollo/client";
import LeadSnapshot from "@/features/leads/profile/LeadSnapshot";
import StageSelect from "@/features/leads/profile/StageSelect";
import EventComposer from "@/features/leads/profile/EventComposer";
import EventTimeline from "@/features/leads/profile/EventTimeline";
import {
  LEAD_PROFILE_QUERY,
  CHANGE_LEAD_STAGE_MUTATION,
  type StageOption,
} from "@/features/leads/profile/gql";

export default function LeadProfilePage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(LEAD_PROFILE_QUERY, {
    variables: { id: leadId },
    skip: !leadId,
  });

  const [changeStage] = useMutation(CHANGE_LEAD_STAGE_MUTATION);

  async function handleStageChange(next: StageOption) {
    if (!data?.lead?.id) return;
    const id = data.lead.id as string;
    await changeStage({
      variables: { id, stage: next },
      optimisticResponse: {
        __typename: "Mutation",
        updateLead: { __typename: "IpkLeaddEntity", id, clientStage: next, leadCode: data.lead.leadCode },
      },
      update(cache, result) {
        const newCode = (result?.data as any)?.updateLead?.leadCode as string | undefined;
        cache.modify({
          id: cache.identify({ __typename: "IpkLeaddEntity", id }),
          fields: {
            clientStage: () => next,
            ...(newCode ? { leadCode: () => newCode } : {}),
          },
        });
      },
    });
  }

  if (loading) return <div className="p-6">Loading lead details…</div>;
  if (error)
    return (
      <div className="p-6 text-rose-600">
        Error loading lead: {(error as ApolloError).message}
      </div>
    );
  if (!data?.lead) return <div className="p-6">Lead not found.</div>;

  const lead = data.lead as any;

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Profile</h1>
        <div className="relative w-full max-w-lg">
          <input
            placeholder="Search leads by name, phone, code…"
            className="h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) navigate(`/sales/leads?q=${encodeURIComponent(v)}&page=1`);
              }
            }}
          />
        </div>
      </div>
      <LeadSnapshot
        lead={lead}
        stageSelect={<StageSelect value={lead.clientStage as StageOption | null} onChange={handleStageChange} />}
      />

      <section className="divide-y rounded-lg border">
        <EventComposer leadId={lead.id} />
        <EventTimeline events={lead.events ?? []} />
      </section>
    </div>
  );
}
