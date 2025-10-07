import React, { useState } from "react";
import {
  CREATE_LEAD_EVENT_MUTATION,
  EVENT_TYPES,
  type LeadEventTypeStr,
} from "./gql";
import { gql, useMutation } from "@apollo/client";

export default function EventComposer({ leadId }: { leadId: string }) {
  const [type, setType] = useState<LeadEventTypeStr | "">("");
  const [note, setNote] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [channel, setChannel] = useState<string>("CALL");
  const [productExplained, setProductExplained] = useState<boolean | null>(null);

  const [createEvent, { loading }] = useMutation(CREATE_LEAD_EVENT_MUTATION);

  async function onSave() {
    if (!type) return;
    const optimisticId = `temp-${Math.random().toString(36).slice(2)}`;
    const composedText = [
      productExplained === null ? null : `Product explained: ${productExplained ? "Yes" : "No"}`,
      channel ? `Channel: ${channel}` : null,
      note?.trim() ? `Note: ${note.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    await createEvent({
      variables: {
        leadId,
        type,
        text: composedText || null,
        nextFollowUpAt: followUpAt || null,
      },
      optimisticResponse: {
        __typename: "Mutation",
        createLeadEvent: {
          __typename: "LeadEventEntity",
          id: optimisticId,
          type,
          occurredAt: new Date().toISOString(),
          text: composedText || null,
          meta: null,
          author: { __typename: "UserEntity", id: "me", name: "You" },
        },
      },
      update(cache, { data }) {
        const newEvent = data?.createLeadEvent;
        if (!newEvent) return;
        cache.modify({
          id: cache.identify({ __typename: "IpkLeaddEntity", id: leadId }),
          fields: {
            events(existing = []) {
              const newRef = cache.writeFragment({
                data: newEvent,
                fragment: gql`
                  fragment _NewEvent on LeadEventEntity {
                    __typename
                    id
                    type
                    occurredAt
                    text
                    meta
                    author { __typename id name }
                  }
                `,
              });
              return [newRef, ...existing];
            },
          },
        });
      },
    });

    setNote("");
    setFollowUpAt("");
    setType("");
    setProductExplained(null);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="font-medium">Your interaction & connected channels</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs text-gray-500">Event status</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LeadEventTypeStr | "")}
            className="mt-1 w-full rounded border px-3 py-2 focus:outline-none"
          >
            <option value="" disabled>
              Select event type
            </option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 focus:outline-none"
          >
            {['CALL','MEET','WHATSAPP','OTHER'].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Next follow-up date</label>
          <input
            type="datetime-local"
            value={followUpAt}
            onChange={(e) => setFollowUpAt(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500">Product explained?</span>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1 text-sm">
            <input type="radio" name="pe" checked={productExplained === true} onChange={() => setProductExplained(true)} />
            Yes
          </label>
          <label className="inline-flex items-center gap-1 text-sm">
            <input type="radio" name="pe" checked={productExplained === false} onChange={() => setProductExplained(false)} />
            No
          </label>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500">Notes</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded border px-3 py-2 focus:outline-none"
          placeholder="Any remarks from the conversation"
        />
      </div>
      <div className="flex justify-end">
        <button
          disabled={loading || !type}
          onClick={onSave}
          className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
