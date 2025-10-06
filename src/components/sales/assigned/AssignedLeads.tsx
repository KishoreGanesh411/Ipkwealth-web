import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Download, Loader2, PhoneCall, RefreshCcw, Search } from "lucide-react";

import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import type { Lead } from "@/components/sales/myleads/interface/type";

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
    return list.filter((lead) =>
      [
        lead.name,
        lead.email ?? "",
        lead.leadCode ?? "",
        lead.mobile ?? "",
        lead.location ?? "",
        String(lead.agingDays ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
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
    console.log("AssignedLeads:onRefresh");
  };

  const handleExport = (format: ExportFormat) => {
    if (loading) return;
    onExport?.(format);
    console.log("AssignedLeads:onExport", format);
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

  const goPrevPage = () => {
    const target = Math.max(1, effectivePage - 1);
    if (target !== effectivePage) {
      handlePageChangeInternal(target);
    }
  };

  const goNextPage = () => {
    const target = Math.min(totalPages, effectivePage + 1);
    if (target !== effectivePage) {
      handlePageChangeInternal(target);
    }
  };

  const goViewLead = (lead: Lead) => navigate(`/sales/leads/${lead.id}`, { state: { lead } });
  const goCallLead = (lead: Lead) => navigate("/sales/call", { state: { lead } });

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
            <ExportButton
              onClick={() => {
                if (loading || !canExport) return;
                setExportOpen((v) => !v);
              }}
              disabled={loading || !canExport}
            />
            <Dropdown isOpen={exportOpen} onClose={() => setExportOpen(false)}>
              <div className="min-w-44 py-1">
                <DropdownItem
                  onClick={() => handleExport("csv")}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                >
                  Download CSV
                </DropdownItem>
                <DropdownItem
                  onClick={() => handleExport("xlsx")}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                >
                  Download Excel (.xlsx)
                </DropdownItem>
              </div>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar overflow-x-auto">
        <Table className="min-w-full">
          <caption className="sr-only">Assigned leads with basic details and actions</caption>
          <TableHeader className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/[0.04] dark:text-white/50">
            <TableRow>
              <TableCell isHeader className="px-6 py-3 align-middle">
                Name
              </TableCell>
              <TableCell isHeader className="px-6 py-3 align-middle">
                Lead ID
              </TableCell>
              <TableCell isHeader className="px-6 py-3 align-middle">
                Mobile No
              </TableCell>
              <TableCell isHeader className="hidden px-6 py-3 align-middle md:table-cell">
                Location
              </TableCell>
              <TableCell isHeader className="hidden px-6 py-3 align-middle md:table-cell">
                Aging Days
              </TableCell>
              <TableCell isHeader className="px-6 py-3 align-middle text-right">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/10">
            {displayedRows.map((lead) => (
              <TableRow
                key={lead.id}
                className="bg-white transition hover:bg-emerald-50/40 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
              >
                <TableCell className="px-6 py-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-xs font-semibold uppercase text-emerald-700">
                      {initials(lead.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-white/90">{lead.name}</div>
                      {lead.email && (
                        <div className="truncate text-xs text-gray-500 dark:text-white/60">{lead.email}</div>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4 align-middle text-sm font-medium text-gray-700 dark:text-gray-200">
                  {lead.leadCode ?? "-"}
                </TableCell>

                <TableCell className="px-6 py-4 align-middle text-sm text-gray-600 dark:text-gray-300">
                  {lead.mobile ?? "-"}
                </TableCell>

                <TableCell className="hidden px-6 py-4 align-middle text-sm text-gray-600 dark:text-gray-300 md:table-cell">
                  {lead.location ?? "-"}
                </TableCell>

                <TableCell className="hidden px-6 py-4 align-middle text-sm font-semibold text-gray-700 dark:text-gray-200 md:table-cell">
                  {formatAgingDays(lead.agingDays)}
                </TableCell>

                <TableCell className="px-6 py-4 align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => goViewLead(lead)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:text-gray-200 dark:hover:border-emerald-300 dark:hover:text-emerald-200"
                    >
                      <span className="hidden sm:inline">View</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      onClick={() => goCallLead(lead)}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-hidden focus:ring-4 focus:ring-emerald-200"
                      title="Call this lead"
                    >
                      <PhoneCall className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden xsm:inline sm:inline">Call</span>
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {loading && displayedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-10">
                  <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-gray-500 dark:text-white/60" role="status">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
                    <span className="font-medium text-gray-600 dark:text-white/70">Loading leads...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading && displayedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-white/60">
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
