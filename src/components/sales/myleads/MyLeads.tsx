import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneCall, ArrowRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Lead, MyLeadsProps } from "./interface/type";
import { LeadStage } from "./interface/type";
import { STAGE_META, STAGE_SEQUENCE } from "./stageMeta";

const FALLBACK_STATUS_BADGE = "inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500";

export default function MyLeads({ leads, pageSize = 8, showHeader = true, query: externalQuery = "" }: MyLeadsProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const list = useMemo(() => (Array.isArray(leads) ? leads : []), [leads]);

  const activeQuery = showHeader ? query : externalQuery;

  const filtered = useMemo(() => {
    if (!activeQuery.trim()) return list;
    const q = activeQuery.toLowerCase();
    return list.filter((lead) => {
      const statusLabel = lead.status ? STAGE_META[lead.status]?.label ?? "" : "";
      return (
        [
          lead.name,
          lead.email ?? "",
          lead.leadCode ?? "",
          lead.mobile ?? "",
          lead.location ?? "",
          lead.leadSource,
          String(lead.agingDays ?? ""),
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
    navigate('/sales/call', { state: { lead } });
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
          <caption className="sr-only">Assigned leads with status and actions</caption>
          <TableHeader className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/[0.04] dark:text-white/50">
            <TableRow>
              <TableCell isHeader className="px-6 py-3">Name</TableCell>
              <TableCell isHeader className="px-6 py-3">Lead ID</TableCell>
              <TableCell isHeader className="px-6 py-3">Mobile No</TableCell>
              <TableCell isHeader className="px-6 py-3">Location</TableCell>
              <TableCell isHeader className="px-6 py-3">Aging Days</TableCell>
              <TableCell isHeader className="px-6 py-3">Client status</TableCell>
              <TableCell isHeader className="px-6 py-3 text-center">View more</TableCell>
              <TableCell isHeader className="px-6 py-3 text-right">Actions</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/10">
            {current.map((lead) => (
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
                className="cursor-pointer transition bg-white hover:bg-emerald-100 focus:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:bg-white/[0.02] dark:hover:bg-emerald-500/15 dark:focus:bg-emerald-500/15"
              >
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-xs font-semibold uppercase text-emerald-700">
                      {initials(lead.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {lead.name}
                      </div>
                      <div className="truncate text-xs text-gray-500 dark:text-gray-300">
                        {lead.email ?? "-"}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {lead.leadCode ?? "-"}
                </TableCell>

                <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {lead.mobile ?? "-"}
                </TableCell>

                <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {lead.location ?? lead.leadSource ?? "-"}
                </TableCell>

                <TableCell className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {formatAgingDays(lead.agingDays)}
                </TableCell>

                <TableCell className="px-6 py-4">
                  <StatusCell status={lead.status} />
                </TableCell>

                <TableCell className="px-6 py-4 text-center">
                  <button
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
            ))}

            {current.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-white/60">
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

function StatusCell({ status }: { status?: LeadStage }) {
  if (!status) {
    return <span className={FALLBACK_STATUS_BADGE}>Status pending</span>;
  }

  const meta = STAGE_META[status];
  const currentIndex = STAGE_SEQUENCE.indexOf(status);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {STAGE_SEQUENCE.map((step, index) => {
          const tone = STAGE_META[step];
          const isActive = index <= currentIndex;
          let base = "bg-emerald-200/60";
          if (index >= 4 && index <= 6) base = "bg-rose-200/40";
          if (index === STAGE_SEQUENCE.length - 1) base = "bg-slate-200/60";
          return (
            <span
              key={step}
              className={`h-2 w-8 rounded-full transition ${isActive ? tone.barClass : base}`}
            />
          );
        })}
      </div>
      <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${meta.pillClass}`}>
        {meta.label}
      </span>
    </div>
  );
}

function formatAgingDays(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "-";
  if (value <= 0) return "Today";
  if (value === 1) return "1 day";
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

