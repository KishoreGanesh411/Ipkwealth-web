import { useLocation, useNavigate } from "react-router-dom";
import { PhoneCall, PhoneForwarded } from "lucide-react";
import { useQuery } from "@apollo/client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import type { Lead } from "@/components/sales/myleads/interface/type";
import { LEAD_DETAIL_WITH_TIMELINE } from "@/core/graphql/lead/lead.gql";

interface LocationState {
  lead?: Lead;
}

export default function CallConnectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? {};
  const lead = state.lead;

  // Fetch the latest lead details (specifically remark) when we have an id
  const { data } = useQuery(LEAD_DETAIL_WITH_TIMELINE, {
    skip: !lead?.id,
    variables: { id: lead?.id, eventsLimit: 50 },
    fetchPolicy: "cache-and-network",
  });

  const apiLead: any = data?.lead;

  const pickLatestFromList = (list: any[] | undefined | null): string | undefined => {
    if (!Array.isArray(list) || list.length === 0) return undefined;
    const ts = (s?: string | null) => {
      const t = s ? Date.parse(s) : NaN;
      return Number.isFinite(t) ? t : 0;
    };
    const sorted = list.slice().sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
    const head = sorted[0];
    return head && typeof head.text === "string" ? head.text : undefined;
  };

  const normalizeRemarkValue = (value: any): string | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      if (typeof value.text === "string") return value.text;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const latestRemark: string | undefined = (() => {
    const fromApiList = pickLatestFromList(apiLead?.remarks);
    if (fromApiList && fromApiList.trim()) return fromApiList;

    const fromApiScalar = normalizeRemarkValue(apiLead?.remark);
    if (fromApiScalar && fromApiScalar.trim()) return fromApiScalar;

    const fromStateScalar = normalizeRemarkValue(lead?.remark);
    return fromStateScalar && fromStateScalar.trim() ? fromStateScalar : undefined;
  })();
  const goBack = () => navigate(-1);
  return (
    <>
      <PageMeta title="Call connect" description="Engage the customer directly" />
      <PageBreadcrumb pageTitle="Call Connect" items={[{ label: "My Leads", href: "/sales/stages" }]} />

      <ComponentCard title="Connection details">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="space-y-6 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 dark:border-emerald-500/20 dark:bg-white/[0.04]">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-500">Lead</p>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {lead?.name ?? (lead?.leadCode ?? `Lead #${lead?.id ?? '-'}`)}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {lead?.leadCode ?? "Lead reference unavailable"}
                </p>
              </div>
              {lead?.status && (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {statusLabel(lead.status)}
                </span>
              )}
            </header>

            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoLine label="Mobile number" value={lead?.mobile ?? "No number provided"} />
              <InfoLine label="Location" value={lead?.location ?? "Not captured"} />
              <InfoLine label="Email" value={lead?.email ?? "Not shared"} />
              <InfoLine label="Lead source" value={lead?.leadSource ?? "-"} />
            </dl>

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-emerald-200/50 dark:bg-white/[0.04] dark:ring-emerald-500/30">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notes</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {latestRemark && latestRemark.trim().length > 0
                  ? latestRemark
                  : "Prepare your pitch, confirm the investment interest, and capture any call outcomes right after the conversation."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => alert("Dialing the customer...")}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-hidden focus:ring-4 focus:ring-emerald-200"
              >
                <PhoneCall className="h-5 w-5" aria-hidden="true" />
                Start call
              </button>
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-200 dark:hover:bg-white/[0.06]"
              >
                <PhoneForwarded className="h-5 w-5" aria-hidden="true" />
                Log outcome later
              </button>
            </div>
          </section>

          <aside className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Call checklist</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li>-  Verify customer identity and confirm lead details.</li>
              <li>-  Clarify investment needs and objections.</li>
              <li>-  Offer the recommended product roadmap.</li>
              <li>-  Schedule next action or mark the lead dormant.</li>
            </ul>

            <div className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
              Remember to update the lead status immediately after the call to keep the pipeline accurate.
            </div>
          </aside>
        </div>
      </ComponentCard>
    </>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}

function statusLabel(status: Lead["status"]) {
  switch (status) {
    case "FIRST_TALK_DONE":
      return "First talk done";
    case "FOLLOWING_UP":
      return "Following up";
    case "CLIENT_INTERESTED":
      return "Client interested";
    case "ACCOUNT_OPENED":
      return "Account opened";
    case "NO_RESPONSE_DORMANT":
      return "No response - dormant";
    case "NOT_INTERESTED_DORMANT":
      return "Not interested - dormant";
    case "RISKY_CLIENT_DORMANT":
      return "Risky client - dormant";
    case "HIBERNATED":
      return "Hibernated";
    default:
      return "Status pending";
  }
}

