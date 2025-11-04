import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Download,
  Loader2,
  PhoneCall,
  RefreshCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow, isValid as isValidDate, parseISO } from "date-fns";

import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import LeadStatusBadge from "@/components/sales/myleads/LeadStatusBadge";
import { leadOptions, valueToLabel } from "@/components/lead/types";
import type { Lead } from "@/components/sales/myleads/interface/type";
import { LeadStage, LeadStatus } from "@/components/sales/myleads/interface/type";
import { STAGE_META, STAGE_SEQUENCE } from "@/components/sales/myleads/stageMeta";
import { useAuth } from "@/context/AuthContex";

type ExportFormat = "csv" | "xlsx";

type AssignedLeadsProps = {
  rows?: Lead[];
  pageSize?: number;
  page?: number;
  totalCount?: number;
  loading?: boolean;
  searchValue?: string;
  onRefresh?: () => void;
  onExport?: (format: ExportFormat) => void;
  onSearchChange?: (value: string) => void;
  onPageChange?: (page: number) => void;
};

const FALLBACK_STAGE_BADGE = "inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500";

export default function AssignedLeads({
  rows = [],
  pageSize = 10,
  page,
  totalCount,
  loading = false,
  searchValue,
  onRefresh,
  onExport,
  onSearchChange,
  onPageChange,
}: AssignedLeadsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [query, setQuery] = useState(searchValue ?? "");
  const [localPage, setLocalPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);

  const isRemote = typeof onPageChange === "function";
  const resolvedPageSize = pageSize ?? 10;

  useEffect(() => {
    if (searchValue !== undefined) {
      setQuery(searchValue);
    }
  }, [searchValue]);

  const list = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  const filtered = useMemo(() => {
    if (isRemote) return list;
    if (!query.trim()) return list;
    const q = query.toLowerCase();
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
  }, [isRemote, list, query]);

  const effectivePage = isRemote ? Math.max(1, page ?? 1) : localPage;
  const effectiveTotal = Math.max(0, isRemote ? totalCount ?? list.length : filtered.length);
  const totalPages = Math.max(1, Math.ceil(Math.max(effectiveTotal, 1) / resolvedPageSize));

  useEffect(() => {
    if (!isRemote) {
      setLocalPage((current) => Math.min(current, totalPages));
    }
  }, [isRemote, totalPages]);

  const displayedRows = useMemo(() => {
    if (isRemote) return filtered;
    const start = (effectivePage - 1) * resolvedPageSize;
    return filtered.slice(start, start + resolvedPageSize);
  }, [effectivePage, filtered, isRemote, resolvedPageSize]);

  const totalForBadge = isRemote ? effectiveTotal : list.length;
  const canExport = displayedRows.length > 0;

  useEffect(() => {
    if (!canExport) {
      setExportOpen(false);
    }
  }, [canExport]);

  const handleRefresh = () => {
    if (loading) return;
    onRefresh?.();
  };

  const handleExport = (format: ExportFormat) => {
    if (loading) return;
    onExport?.(format);
    setExportOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setLocalPage(1);
    if (isRemote) {
      onPageChange?.(1);
    }
    onSearchChange?.(value);
  };

  const handlePageChangeInternal = (nextPage: number) => {
    if (isRemote) {
      if (nextPage !== effectivePage) {
        onPageChange?.(nextPage);
      }
    } else {
      setLocalPage(nextPage);
    }
  };

  const goPrevPage = () => handlePageChangeInternal(Math.max(1, effectivePage - 1));
  const goNextPage = () => handlePageChangeInternal(Math.min(totalPages, effectivePage + 1));

  const goViewLead = (lead: Lead) => {
    navigate(`/sales/leads/${lead.id}`, { state: { lead } });
  };

  const goCallLead = (lead: Lead) => {
    navigate("/sales/call", { state: { lead } });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Assigned Leads</h2>
          <span className="text-xs text-gray-400">({totalForBadge})</span>
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <FilterBox value={query} onChange={handleSearchChange} />

          <RefreshButton onClick={handleRefresh} disabled={loading} />

          <div className="relative">
            <ExportButton onClick={() => setExportOpen((v) => !v)} disabled={!canExport} />
            <Dropdown isOpen={exportOpen} onClose={() => setExportOpen(false)}>
              <div className="min-w-44 py-1">
                <DropdownItem
                  onClick={() => handleExport("csv")}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                >
                  Download CSV
                </DropdownItem>
                <DropdownItem
                  onClick={() => handleExport("xlsx")}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                >
                  Download Excel (.xlsx)
                </DropdownItem>
              </div>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <Table className="min-w-full">
          <caption className="sr-only">Assigned leads with pipeline context and actions</caption>
          <TableHeader className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/[0.04] dark:text-white/50">
            <TableRow>
              <TableCell isHeader className="px-6 py-3">Name</TableCell>
              <TableCell isHeader className="px-6 py-3">Lead ID</TableCell>
              {isAdmin && <TableCell isHeader className="px-6 py-3">RM</TableCell>}
              <TableCell isHeader className="px-6 py-3">Mobile No</TableCell>
              <TableCell isHeader className="px-6 py-3">Stage</TableCell>
              <TableCell isHeader className="px-6 py-3">Status</TableCell>
              <TableCell isHeader className="px-6 py-3">Last contact</TableCell>
              <TableCell isHeader className="px-6 py-3 text-center">View more</TableCell>
              <TableCell isHeader className="px-6 py-3 text-right">Actions</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/10">
            {displayedRows.map((lead) => {
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

                  <TableCell className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800 dark:text-white/80">{lead.leadCode ?? "-"}</div>
                    {lead.agingDays !== undefined && (
                      <div className="text-xs text-gray-500 dark:text-white/60">{formatAgingDays(lead.agingDays)}</div>
                    )}
                  </TableCell>

                  {isAdmin && (
                    <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-white/80">
                      {lead.assignedRm ?? "-"}
                    </TableCell>
                  )}
                  <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-white/80">
                    {lead.mobile ?? "-"}
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <StageCell stage={lead.clientStage} />
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-white/80">
                    {formatLastContact(lead.lastContactedAt)}
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

            {loading && displayedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="px-6 py-10">
                  <div
                    className="flex flex-col items-center justify-center gap-2 text-center text-sm text-gray-500 dark:text-white/60"
                    role="status"
                  >
                    <Loader2
                      className="h-5 w-5 animate-spin text-emerald-500 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <span className="font-medium text-gray-600 dark:text-white/70">Loading — please wait</span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading && displayedRows.length === 0 && (
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
          disabled={effectivePage <= 1}
          onClick={goPrevPage}
        >
          Previous
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1;
            const isActive = pageNumber === effectivePage;
            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChangeInternal(pageNumber)}
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
          disabled={effectivePage >= totalPages}
          onClick={goNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function FilterBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1 sm:flex-none">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name, mobile, lead ID..."
        className="h-10 w-full rounded-xl border border-gray-200 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30 sm:w-80"
      />
    </div>
  );
}

function RefreshButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      startIcon={<RefreshCcw className="h-4 w-4" />}
      className="dropdown-toggle h-10"
      disabled={disabled}
    >
      Refresh
    </Button>
  );
}

function ExportButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      startIcon={<Download className="h-4 w-4" />}
      className="dropdown-toggle h-10"
      disabled={disabled}
    >
      Export
    </Button>
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
