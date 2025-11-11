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
    approachAt?: string | null;
    createdAt?: string | null;
  };
  stageSelect: React.ReactNode;
};

export default function LeadSnapshot({ lead, stageSelect }: LeadSnapshotProps) {
  const fallback = (v?: string | null) => (v && v.length > 0 ? v : "--");

  const phone = displayPhone(lead);
  const clientType = inferClientTypeFromProfession(lead.profession ?? undefined);
  const enteredRaw = lead.approachAt || lead.createdAt || null;
  const enteredAt = enteredRaw ? new Date(enteredRaw) : null;
  const enteredOn = enteredAt
    ? new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(enteredAt)
    : "--";
  const aging = enteredAt ? describeLeadAge(enteredAt) : "--";

  const leadHighlights = [
    { label: "Lead source", value: fallback(lead.leadSource) },
    { label: "Entered on", value: enteredOn },
    { label: "Product", value: fallback(lead.product) },
    { label: "Investment / SIP", value: fallback(lead.investmentRange) },
    { label: "Aging", value: aging },
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,1fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,1fr)]">
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoTile label="Lead name" value={fallback(lead.name)} />

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Current stage</div>
          <div className="mt-2">{stageSelect}</div>
        </div>

        <InfoTile label="Lead number" value={fallback(phone)} />
        <InfoTile label="Occupation" value={fallback(lead.profession)} />
        <InfoTile label="Client type (auto)" value={fallback(clientType)} />
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">Lead code</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">{fallback(lead.leadCode)}</p>
            <p className="mt-2 text-xs text-emerald-700/70">Share this code with teammates or clients.</p>
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(lead.leadCode ?? "")}
            className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
          >
            Copy
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-emerald-900">
          {leadHighlights.map((item) => (
            <div
              key={item.label}
              className="min-w-[140px] flex-1 rounded-xl border border-emerald-100 bg-white/70 px-3 py-2 shadow-[0_1px_2px_rgba(16,185,129,0.08)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                {item.label}
              </p>
              <p className="mt-1 text-base font-semibold text-emerald-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-base font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function describeLeadAge(createdAt: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor((Date.now() - createdAt.getTime()) / dayMs);

  if (days <= 0) return "Today";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} wk`;
  if (days < 365) return `${Math.floor(days / 30)} mo`;
  return `${Math.floor(days / 365)} yr`;
}
