import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, PhoneCall, Sparkles } from "lucide-react";
import { formatDistanceToNow, isValid as isValidDate, parseISO } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LeadStatusBadge from "./LeadStatusBadge";
import { leadOptions, valueToLabel } from "@/components/lead/types";
import type { Lead, MyLeadsProps } from "./interface/type";
import { LeadStage, LeadStatus } from "./interface/type";
import { STAGE_META, STAGE_SEQUENCE } from "./stageMeta";

const FALLBACK_STAGE_BADGE = "inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500";

export default function MyLeads({
  leads,
  pageSize = 8,
  showHeader = true,
  query: externalQuery = "",
  // Optional busy indicator to show a unified loading row
  loading = false,
  showAssignedRm = false,
}: MyLeadsProps & { loading?: boolean; showAssignedRm?: boolean }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const list = useMemo(() => (Array.isArray(leads) ? leads : []), [leads]);
  const colSpan = 8 + (showAssignedRm ? 1 : 0);

  const activeQuery = showHeader ? query : externalQuery;

  const filtered = useMemo(() => {
    if (!activeQuery.trim()) return list;
    const q = activeQuery.toLowerCase();
    return list.filter((lead) => {
      const stageLabel = lead.clientStage ? STAGE_META[lead.clientStage]?.label ?? "" : "";
      const statusLabel = lead.status ? formatLeadStatus(lead.status) : "";
      return (
        [
          lead.name,
          lead.email ?? "",
          lead.leadCode ?? "",
          lead.mobile ?? "",
          lead.location ?? "",
          lead.leadSource ?? "",
          String(lead.agingDays ?? ""),
          stageLabel,
          statusLabel,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [list, activeQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const goViewLead = (lead: Lead) => {
    navigate(`/sales/leads/${lead.id}`, { state: { lead } });
  };

  const goCallLead = (lead: Lead) => {
    navigate("/sales/call", { state: { lead } });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      {showHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Assigned Leads</h2>
            <span className="text-xs text-gray-400">({list.length})</span>
          </div>
          <div role="search" aria-label="Search leads">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, mobile, status..."
              className="h-10 w-72 rounded-xl border border-gray-200 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <caption className="sr-only">Assigned leads with status, stage, and actions</caption>
          <TableHeader className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/[0.04] dark:text-white/50">
            <TableRow>
              <TableCell isHeader className="px-6 py-3">Lead ID</TableCell>
              <TableCell isHeader className="px-6 py-3">Name</TableCell>
              <TableCell isHeader className="px-6 py-3">Mobile No</TableCell>
              <TableCell isHeader className="px-6 py-3">Stage</TableCell>
              <TableCell isHeader className="px-6 py-3">Status</TableCell>
              {showAssignedRm && (
                <TableCell isHeader className="px-6 py-3">Assigned RM</TableCell>
              )}
              <TableCell isHeader className="px-6 py-3">Next follow-up</TableCell>
              <TableCell isHeader className="px-6 py-3 text-center">View more</TableCell>
              <TableCell isHeader className="px-6 py-3 text-right">Actions</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/10">
            {current.map((lead) => {
              const rowBase = lead.isNew
                ? "bg-emerald-50/70 hover:bg-emerald-100 focus:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
                : "bg-white hover:bg-emerald-100 focus:bg-emerald-100 dark:bg-white/[0.02] dark:hover:bg-emerald-500/15";

              return (
                <TableRow
                  key={lead.id}
                  onClick={() => goViewLead(lead)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goViewLead(lead);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${rowBase}`}
                >
                  {/* Lead Code first */}
                  <TableCell className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800 dark:text-white/80">{lead.leadCode ?? "-"}</div>
                    {lead.agingDays !== undefined && (
                      <div className="text-xs text-gray-500 dark:text-white/60">{formatAgingDays(lead.agingDays)}</div>
                    )}
                  </TableCell>

                  {/* Name and source */}
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                          {initials(lead.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{lead.name}</span>
                            {lead.isNew && <NewBadge />}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-white/60">{valueToLabel(lead.leadSource as any, leadOptions) || "-"}</div>
                        </div>
                      </div>
                      {lead.location && (
                        <div className="text-xs text-gray-500 dark:text-white/50">{lead.location}</div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-white/80">
                    {lead.mobile ?? "-"}
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <StageCell stage={lead.clientStage} />
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>
                  {showAssignedRm && (
                    <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-white/80">
                      {lead.assignedRm ?? 'Unassigned'}
                    </TableCell>
                  )}

                  <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-white/80">
                    {formatNextFollowUp(lead.nextActionDueAt)}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-center">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        goViewLead(lead);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:text-gray-200 dark:hover:border-emerald-300 dark:hover:text-emerald-200"
                    >
                      View
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </TableCell>

                  <TableCell className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        goCallLead(lead);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-hidden focus:ring-4 focus:ring-emerald-200"
                      title="Call this lead"
                    >
                      <PhoneCall className="h-4 w-4" aria-hidden="true" />
                      Call
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}

            {loading && current.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} className="px-6 py-10">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-white/70" role="status">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600" aria-hidden />
                    Loading — please wait
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && current.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-white/60">
                  No leads to show
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <button
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
          disabled={page <= 1}
          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
        >
          Previous
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1;
            const isActive = pageNumber === page;
            return (
              <button
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={
                  isActive
                    ? "rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow"
                    : "rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                }
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        <button
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
          disabled={page >= totalPages}
          onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StageCell({ stage }: { stage?: LeadStage }) {
  if (!stage) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className={FALLBACK_STAGE_BADGE}>Stage pending</span>
        <span className="h-1.5 w-16 rounded-full bg-gray-200" />
      </div>
    );
  }

  const meta = STAGE_META[stage];

  return (
    <div className="flex flex-col gap-1.5">
      <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${meta.pillClass}`}>
        {meta.label}
      </span>
      <span className={`h-1.5 w-16 rounded-full ${meta.barClass}`} />
    </div>
  );
}

function NewBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      New
    </span>
  );
}

function formatLastContact(value?: string | null) {
  if (!value) return "No contact yet";
  try {
    const date = parseISO(value);
    if (!isValidDate(date)) return value;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return value;
  }
}

function formatNextFollowUp(value?: string | null) {
  if (!value) return "No follow-up yet";
  try {
    const date = parseISO(value);
    if (!isValidDate(date)) return value;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return value;
  }
}

function formatLeadStatus(status?: LeadStatus | LeadStage | string | null) {
  if (!status) return "Pending";
  return String(status)
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function formatAgingDays(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "-";
  if (value <= 0) return "Today";
  if (value === 1) return "1 day";
  const months = Math.floor(value / 30);
  const days = value % 30;
  if (months >= 1) {
    const mPart = `${months} ${months === 1 ? "month" : "months"}`;
    const dPart = days > 0 ? ` ${days} ${days === 1 ? "day" : "days"}` : "";
    return mPart + dPart;
  }
  return `${value} days`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export type { Lead } from "./interface/type";
