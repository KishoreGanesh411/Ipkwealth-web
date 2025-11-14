// src/components/lead/LeadData/LeadDataTable.tsx
import {
  memo, useCallback, useEffect, useMemo, useRef, useState, forwardRef,
} from "react";
import { useLazyQuery, useMutation, useApolloClient, ApolloError } from "@apollo/client";
import { LEADS_OPEN, ASSIGN_LEAD, ASSIGN_LEADS, REASSIGN_LEAD } from "@/core/graphql/lead/lead.gql";
import Alert from "@/components/ui/alert/Alert";
import { Table, TableBody } from "@/components/ui/table";
import { LeadTableHeader } from "./LeadTableHeader";
import { LeadTableRow, Row } from "./LeadTableRow";
import { LeadTableFooter } from "./LeadTableFooter";
import { PAGE_SIZE, TopCenterLoader, useDebounced } from "./leadHelpers";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import * as XLSX from "xlsx";
import LeadFiltersModal, { LeadFilters } from "./LeadFilters";
import {
  titleCaseWords,
  valueToLabel,
  leadOptions,
  humanizeEnum,
} from "@/components/lead/types";
import { useAuth } from "@/context/AuthContex";
import { useRms } from "@/core/graphql/user/useRms";

/* ----------------------------- GQL shapes ----------------------------- */
type LeadItemGql = {
  id?: string | null;
  leadCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  phone?: string | null;
  leadSource?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  // extra telemetry for dormant view
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  reenterCount?: number | null;

  assignedRM?: string | null;
  // Note: some APIs expose assignedRm { name }, keep fallback usage safe:
  assignedRm?: { name?: string | null } | null;
  assignedRmId?: string | null;

  status?: string | null;
};

type LeadsQueryData = {
  leads?: {
    items: LeadItemGql[];
    page: number;
    pageSize: number;
    total: number;
  } | null;
};

type LeadsQueryVars = {
  args: {
    page: number;
    pageSize: number;
    archived: boolean;
    status: string | null;
    search: string | null;

    // Dormant filters
    dormantOnly?: boolean | null;
    dormantDays?: number | null;
  };
};

type Notice =
  | { variant: "success" | "warning" | "error" | "info"; title: string; message: string }
  | null;

type ViewMode = "all" | "unassigned" | "dormant";

/* ------------------------------ Formatters ------------------------------ */

const toTitleOrNull = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return titleCaseWords(trimmed);
};

const toDisplayName = (lead: LeadItemGql): string => {
  const composed = lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(" ");
  const trimmed = composed.trim();
  if (!trimmed) return "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â";
  return titleCaseWords(trimmed);
};

const toLeadSource = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return valueToLabel(trimmed, leadOptions, true);
};

const toStatus = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return humanizeEnum(trimmed);
};

/* ------------------------ Search (memo + ref) ------------------------ */
type SearchBarProps = { value: string; onChange: (v: string) => void; onReset: () => void };
const SearchBar = memo(
  forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar({ value, onChange, onReset }, ref) {
    return (
      <>
        <input
          ref={ref}
          className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-white/80 sm:w-64"
          placeholder="Search by name, phone, source, code"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onReset()}
          autoComplete="off"
          aria-label="Search leads"
        />
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
        >
          Refresh
        </button>
      </>
    );
  }),
);

/* ------------------- Dormant-only header & row ------------------- */
function DormantHeader() {
  return (
    <thead className="bg-gray-50 dark:bg-white/5">
      <tr>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">Lead Code</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">Name</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">Phone</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">Lead Source</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">Re-entries</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">First Entered</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">Last Entered</th>
      </tr>
    </thead>
  );
}

function DormantRow({
  r,
}: {
  r: Row & { firstSeenAt?: string | null; lastSeenAt?: string | null; reenterCount?: number | null };
}) {
  return (
    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5">
      <td className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{r.leadCode ?? "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</td>
      <td className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{r.name}</td>
      <td className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{r.phone ?? "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</td>
      <td className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{r.source ?? "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</td>
      <td className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{r.reenterCount ?? 0}</td>
      <td className="px-5 py-3 text-sm text-gray-600 dark:text-white/70">
        {r.firstSeenAt ? new Date(r.firstSeenAt).toLocaleDateString() : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}
      </td>
      <td className="px-5 py-3 text-sm text-gray-600 dark:text-white/70">
        {r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleDateString() : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}
      </td>
    </tr>
  );
}

/* ------------------------------- Table ------------------------------- */
const EMPTY_ITEMS: ReadonlyArray<LeadItemGql> = Object.freeze([]);

export default function LeadDataTable() {
  const client = useApolloClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  // Only admins can load RM roster to avoid 400 for marketing users
  const { rms, loading: rmsLoading, error: rmsError } = useRms(isAdmin);
  const assignableRmOptions = useMemo(
    () => rms.map((rm) => ({ value: rm.id, label: rm.name })),
    [rms],
  );

  const [mode, setMode] = useState<ViewMode>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<Notice>(null);
  // Auto-dismiss success notices after 6 seconds
  useEffect(() => {
    if (!notice || notice.variant !== "success") return;
    const t = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(t);
  }, [notice]);
  const [genDone, setGenDone] = useState(false);
  const [filters, setFilters] = useState<LeadFilters>({ from: null, to: null, rm: null, source: null });
  const [filterOpen, setFilterOpen] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [confirmAssign, setConfirmAssign] = useState<{
    leadId: string;
    rmId: string | null;
    rmName: string;
    leadName: string;
  } | null>(null);

  const isUnassignedView = mode === "unassigned";
  const isDormant = mode === "dormant";

  const dormantDays = Number(import.meta.env.VITE_DORMANT_DAYS ?? 60);

  const variables = useMemo<LeadsQueryVars>(
    () => ({
      args: {
        page,
        pageSize: PAGE_SIZE,
        archived: false,
        status: null,
        search: debouncedSearch || null,
        dormantOnly: isDormant ? true : null,
        dormantDays: isDormant ? dormantDays : null,
      },
    }),
    [page, debouncedSearch, isDormant, dormantDays],
  );

  const [runLeads, { data, loading, error, previousData, networkStatus }] = useLazyQuery<
    LeadsQueryData,
    LeadsQueryVars
  >(LEADS_OPEN, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const lastArgs = useRef<string>("");
  useEffect(() => {
    const next = JSON.stringify(variables.args);
    if (next !== lastArgs.current) {
      lastArgs.current = next;
      runLeads({ variables });
    }
  }, [variables, runLeads]);

  const pageData = data?.leads ?? previousData?.leads;
  const items = (pageData?.items ?? EMPTY_ITEMS) as LeadItemGql[];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const rows: (Row & {
    firstSeenAt?: string | null;
    lastSeenAt?: string | null;
    reenterCount?: number | null;
  })[] = useMemo(
    () =>
      items.map((l) => ({
        id: l.id ?? "",
        leadCode: l.leadCode ?? null,
        name: toDisplayName(l),
        phone: l.phone ?? null,
        source: toLeadSource(l.leadSource),
        createdAt: l.createdAt ?? null,
        assignedRm: toTitleOrNull(l.assignedRM ?? l.assignedRm?.name ?? null),
        assignedRmId: l.assignedRmId ?? null,
        status: toStatus(l.status),
        firstSeenAt: l.firstSeenAt ?? null,
        lastSeenAt: l.lastSeenAt ?? null,
        reenterCount: l.reenterCount ?? 0,
      })),
    [items],
  );

  const filterRmOptions = useMemo(() => {
    const names = new Set<string>();
    for (const r of rows) if (r.assignedRm) names.add(r.assignedRm);
    return Array.from(names).sort();
  }, [rows]);

  const visibleRows = useMemo(() => {
    const lower = (s?: string | null) => (s || "").toLowerCase().trim();
    return rows.filter((r) => {
      // View mode: Unassigned -> only leads without an assigned RM id
      if (isUnassignedView && r.assignedRmId) return false;

      if (filters.rm) {
        if (filters.rm === "UNASSIGNED") {
          if (r.assignedRm) return false;
        } else if (lower(r.assignedRm) !== lower(filters.rm)) {
          return false;
        }
      }
      if (filters.source && lower(r.source) !== lower(filters.source)) return false;
      if (filters.from || filters.to) {
        if (!r.createdAt) return false;
        const ts = Date.parse(r.createdAt);
        if (Number.isNaN(ts)) return false;
        const d = new Date(ts);
        const only = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        if (filters.from) {
          const [fy, fm, fd] = String(filters.from).split("-").map((x) => parseInt(x, 10));
          if (only < Date.UTC(fy, fm - 1, fd)) return false;
        }
        if (filters.to) {
          const [ty, tm, td] = String(filters.to).split("-").map((x) => parseInt(x, 10));
          if (only > Date.UTC(ty, tm - 1, td)) return false;
        }
      }
      return true;
    });
  }, [rows, filters, isUnassignedView]);

  // Selection helpers (unused in Dormant mode)
  const rowKey = (r: Row) => r.id;
  const allSelected = visibleRows.length > 0 && visibleRows.every((r) => selected.has(rowKey(r)));
  const toggleAll = (checked: boolean) => {
    const ids = new Set(visibleRows.map(rowKey));
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) ids.forEach((k) => next.add(k));
      else ids.forEach((k) => next.delete(k));
      return next;
    });
  };
  const toggleOne = useCallback((rk: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(rk);
      else next.delete(rk);
      return next;
    });
  }, []);

  // Actions (disabled in Dormant mode)
  const [assignLeadMut, { loading: loadingSingle }] = useMutation(ASSIGN_LEAD);
  const [reassignLeadMut] = useMutation(REASSIGN_LEAD);
  const [assignLeadsMut, { loading: loadingBatch }] = useMutation(ASSIGN_LEADS);
  const generating = loadingSingle || loadingBatch || networkStatus === 3;

  useEffect(() => {
    if (rmsError) {
      setNotice({
        variant: "error",
        title: "Failed to load RM list",
        message: rmsError.message,
      });
    }
  }, [rmsError]);

  const onEdit = (r: Row) =>
    setNotice({ variant: "info", title: "Edit Lead", message: `Editing ${r.name} (${r.phone ?? ""})` });

  const onDelete = () =>
    setNotice({ variant: "info", title: "Not Implemented", message: "Contact Admin to delete this." });

  const refetchActive = useCallback(async () => {
    await client.refetchQueries({ include: "active" });
  }, [client]);

  const handleAssignRm = useCallback(
    async (leadId: string, rmId: string | null) => {
      if (!leadId || !isAdmin) return;
      const current = rows.find((r) => r.id === leadId);
      if (current && (current.assignedRmId ?? null) === (rmId ?? null)) return;

      try {
        setUpdatingLeadId(leadId);
        if (rmId) {
          await reassignLeadMut({ variables: { input: { leadId, newRmId: rmId } } });
        } else {
          await assignLeadMut({ variables: { id: leadId } });
        }
        await refetchActive();
        await runLeads({ variables });

        const rmName = rmId
          ? assignableRmOptions.find((opt) => opt.value === rmId)?.label ?? "selected RM"
          : "Auto assign";
        const leadName = current?.name ?? "Selected lead";
        setNotice({
          variant: "success",
          title: "RM updated",
          message: rmId
            ? `${leadName} re-assigned to ${rmName}.`
            : `${leadName} set to auto assign.`,
        });
      } catch (err) {
        let message = "Unknown error";
        if (err instanceof ApolloError) message = err.graphQLErrors[0]?.message || err.message;
        else if (err instanceof Error) message = err.message;
        setNotice({ variant: "error", title: "Assignment Failed", message });
      } finally {
        setUpdatingLeadId(null);
      }
    },
    [rows, assignLeadMut, refetchActive, runLeads, variables, assignableRmOptions, isAdmin],
  );

  const generateLead = async () => {
    if (isDormant) return; // not allowed in Dormant view
    try {
      const ids = [...selected];
      const candidates = ids.length ? rows.filter((r) => ids.includes(r.id)) : rows;
      const pendingOnPage = candidates
        .filter((r) => !r.assignedRm || !r.leadCode)
        .map((r) => r.id);

      if (pendingOnPage.length === 0) {
        setNotice({
          variant: "info",
          title: "Nothing to Generate",
          message: "All visible leads already have Lead Code & RM.",
        });
        return;
      }
      if (pendingOnPage.length === 1) {
        await assignLeadMut({ variables: { id: pendingOnPage[0] } });
      } else {
        await assignLeadsMut({ variables: { ids: pendingOnPage } });
      }

      setSelected(new Set());
      setGenDone(true);
      setTimeout(() => setGenDone(false), 900);
      setPage(1);
      await refetchActive();
      setNotice({
        variant: "success",
        title: "Lead Codes Assigned",
        message: `${pendingOnPage.length} lead(s) were assigned.`,
      });
    } catch (err: unknown) {
      let message = "Unknown error";
      if (err instanceof ApolloError) message = err.graphQLErrors[0]?.message || err.message;
      else if (err instanceof Error) message = err.message;
      setNotice({ variant: "error", title: "Assignment Failed", message });
    }
  };

  // Download XLSX (context-aware)
  const handleDownloadXlsx = () => {
    const chosen = selected.size > 0 && !isDormant ? visibleRows.filter((r) => selected.has(r.id)) : visibleRows;

    const exportRows = isDormant
      ? chosen.map((r) => ({
          "Lead Code": r.leadCode ?? "",
          Name: r.name,
          Phone: r.phone ?? "",
          "Lead Source": r.source ?? "",
          "Re-enter Count": r.reenterCount ?? 0,
          "First Entered": r.firstSeenAt ?? "",
          "Last Entered": r.lastSeenAt ?? "",
        }))
      : chosen.map((r) => ({
          "Lead Code": r.leadCode ?? "",
          Name: r.name,
          Phone: r.phone ?? "",
          "Lead Source": r.source ?? "",
          "Assigned RM": r.assignedRm ?? "",
          "Entered Date": r.createdAt ?? "",
          Status: r.status ?? "",
        }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, isDormant ? "Dormant" : "Leads");
    XLSX.writeFile(wb, `${isDormant ? "dormant" : "leads"}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const searchRef = useRef<HTMLInputElement>(null);
  const handleReset = () => {
    setSearch("");
    setFilters({ from: null, to: null, rm: null, source: null });
    setSelected(new Set());
    setPage(1);
    requestAnimationFrame(() => {
      searchRef.current?.focus();
      if (searchRef.current) searchRef.current.value = "";
    });
    setNotice({ variant: "success", title: "Filters Cleared", message: "Showing latest leads." });
  };

  const showAdvancedCols = !isDormant && visibleRows.some((l) => !!l.leadCode || !!l.assignedRm);

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <TopCenterLoader show={loading || generating} />

      {notice && (
        <div className="p-3">
          <Alert variant={notice.variant} title={notice.title} message={notice.message} showLink={false} />
        </div>
      )}

      {error && (
        <div className="px-4">
          <Alert variant="error" title="Failed to load leads" message={error.message} showLink={false} />
        </div>
      )}

      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 dark:border-white/[0.05] md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-medium text-gray-800 dark:text-white/90">
            Leads (
            {mode === "dormant"
              ? "Dormant"
              : mode === "unassigned"
              ? "Unassigned"
              : "All"}
            )
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={mode}
            onChange={(e) => {
              const next = e.target.value as ViewMode;
              setMode(next);
              setSelected(new Set());
              setPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-white/80"
            title="View Mode"
          >
            <option value="all">All</option>
            <option value="unassigned">Unassigned</option>
            <option value="dormant">Dormant</option>
          </select>

          <SearchBar
            ref={searchRef}
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            onReset={handleReset}
          />

                    <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/5"
            title="Filter"
          >
            Filter
          </button>

          <button
            type="button"
            onClick={handleDownloadXlsx}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/5"
            title="Download as Excel"
          >
            Download
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto" aria-busy={Boolean(loading || generating)}>
        <Table>
          {isDormant ? (
            <>
              <DormantHeader />
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {visibleRows.map((row) => (
                  <DormantRow key={row.id} r={row} />
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-500 dark:text-emerald-400" />
                          Loading — please wait
                        </div>
                      ) : (
                        "No leads to show."
                      )}
                    </td>
                  </tr>
                )}
              </TableBody>
            </>
          ) : (
            <>
              <LeadTableHeader
                showAdvancedCols={showAdvancedCols}
                allSelected={visibleRows.length > 0 && allSelected}
                toggleAll={toggleAll}
              />
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {visibleRows.map((row) => {
                  const id = rowKey(row);
                  return (
              <LeadTableRow
                  key={id}
                  row={row}
                  showAdvancedCols={showAdvancedCols}
                  canAssignRm={isAdmin}
                  rmOptions={assignableRmOptions}
                  rmLoading={rmsLoading}
                  assigning={updatingLeadId === row.id}
                  onAssignRm={(leadId: string, rmId: string | null) => {
                    if (!isAdmin) return;
                    const r = rows.find((x) => x.id === leadId);
                    const leadName = r?.name ?? "Selected lead";
                    const rmName = rmId
                      ? assignableRmOptions.find((o) => o.value === rmId)?.label ?? "selected RM"
                      : "Auto assign";
                    setConfirmAssign({ leadId, rmId, rmName, leadName });
                  }}
                  isSelected={selected.has(id)}
                  onToggle={toggleOne}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
                  );
                })}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={showAdvancedCols ? 8 : 6} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600" aria-hidden />
                          Loading — please wait
                        </div>
                      ) : (
                        "No leads to show."
                      )}
                    </td>
                  </tr>
                )}
              </TableBody>
            </>
          )}
        </Table>
      </div>

      {confirmAssign && (
        <Modal isOpen={true} onClose={() => setConfirmAssign(null)} className="max-w-md m-4">
          <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Assignment</h3>
            <p className="mt-2 text-sm text-gray-700 dark:text-white/80">
              Assign <span className="font-medium">{confirmAssign.leadName}</span> to
              {" "}
              <span className="font-medium">{confirmAssign.rmName}</span>?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAssign(null)}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { leadId, rmId } = confirmAssign;
                  setConfirmAssign(null);
                  await handleAssignRm(leadId, rmId);
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Yes, Assign
              </button>
            </div>
          </div>
        </Modal>
      )}

      {!isDormant && rows.length > 0 && (
        <LeadTableFooter
          page={page}
          totalPages={totalPages}
          setPage={(p) => setPage(p)}
          generateLead={generateLead}
          generating={generating}
          genDone={genDone}
        />
      )}


      <LeadFiltersModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        onApply={setFilters}
        rmOptions={filterRmOptions}
      />
    </div>
  );
}
