import React from "react";
import type { StageOption } from "./gql";
import { displayPhone, inferClientTypeFromProfession } from "./gql";

type LeadSnapshotProps = {
  lead: {
    id: string;
    leadCode?: string | null;
    name?: string | null;
    clientStage?: StageOption | null;
    product?: string | null;
    investmentRange?: string | null;
    phone?: string | null;
    leadSource?: string | null;
    profession?: string | null;
    createdAt?: string | null;
  };
  stageSelect: React.ReactNode;
};

export default function LeadSnapshot({ lead, stageSelect }: LeadSnapshotProps) {
  const fallback = (v?: string | null) => (v && v.length > 0 ? v : "—");

  const phone = displayPhone(lead);
  const clientType = inferClientTypeFromProfession(lead.profession ?? undefined);

  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <div className="rounded-lg border p-4">
        <div className="text-xs text-gray-500">Lead code</div>
        <div className="font-semibold flex items-center gap-2">
          {fallback(lead.leadCode)}
          <button
            onClick={() => navigator.clipboard.writeText(lead.leadCode ?? "")}
            className="ml-2 rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
          >
            Copy
          </button>
        </div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-xs text-gray-500">Lead name</div>
        <div className="font-semibold">{fallback(lead.name)}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-xs text-gray-500">Current stage</div>
        {stageSelect}
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-xs text-gray-500">Product</div>
        <div className="font-semibold">{fallback(lead.product)}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-xs text-gray-500">Investment range</div>
        <div className="font-semibold">{fallback(lead.investmentRange)}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-xs text-gray-500">Lead number</div>
        <div className="font-semibold">{fallback(phone)}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-xs text-gray-500">Lead source</div>
        <div className="font-semibold">{fallback(lead.leadSource)}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-xs text-gray-500">Assigned date</div>
        <div className="font-semibold">
          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}
        </div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-xs text-gray-500">Occupation</div>
        <div className="font-semibold">{fallback(lead.profession)}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-xs text-gray-500">Client type (auto)</div>
        <div className="font-semibold">{fallback(clientType)}</div>
      </div>
    </section>
  );
}
