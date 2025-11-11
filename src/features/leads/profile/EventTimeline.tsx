import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_LEAD_EVENT_MUTATION } from "./gql";

type Event = {
  id: string;
  type: string;
  occurredAt: string;
  text?: string | null;
  meta?: any;
  author?: { id: string; name?: string | null } | null;
};

export default function EventTimeline({ events }: { events: Event[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [updateEvent, { loading: saving }] = useMutation(UPDATE_LEAD_EVENT_MUTATION);
  if (!events || events.length === 0) {
    return <div className="p-4 text-sm text-gray-500">No events yet.</div>;
  }

  return (
    <div className="p-4 max-h-[40vh] overflow-auto">
      <div className="mb-2 font-medium">History</div>
      <ul className="space-y-3">
        {events.map((ev) => {
          const isEditing = editingId === ev.id;
          return (
            <li key={ev.id} className="rounded border bg-gray-50 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{ev.type.replace(/_/g, " ")}</div>
                  <div className="text-xs text-gray-500">{new Date(ev.occurredAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                        disabled={saving}
                        onClick={async () => {
                          await updateEvent({
                            variables: { id: ev.id, text: draft },
                            optimisticResponse: {
                              __typename: "Mutation",
                              updateLeadEvent: { __typename: "LeadEventEntity", ...ev, text: draft },
                            },
                            update(cache, { data }) {
                              const updated = data?.updateLeadEvent ?? { ...ev, text: draft };
                              cache.modify({
                                id: cache.identify({ __typename: "LeadEventEntity", id: ev.id }),
                                fields: { text: () => updated.text },
                              });
                            },
                          });
                          setEditingId(null);
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => {
                        setEditingId(ev.id);
                        setDraft(ev.text ?? "");
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <textarea
                  className="mt-2 w-full rounded border p-2"
                  rows={3}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              ) : (
                <>
                  {ev.text && <div className="mt-2">{ev.text}</div>}
                  {ev.meta && (ev as any).meta?.note && (
                    <div className="mt-1">{(ev as any).meta?.note}</div>
                  )}
                  {ev.author && (
                    <div className="mt-1 text-xs text-gray-500">by {ev.author?.name ?? "Unknown"}</div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
