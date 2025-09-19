// src/components/lead/LeadData/LeadDataTable.tsx
import {
  memo, useCallback, useEffect, useMemo, useRef, useState, forwardRef,
} from "react";
import { useLazyQuery, useMutation, useApolloClient, ApolloError } from "@apollo/client";
import { LEADS_OPEN, ASSIGN_LEAD, ASSIGN_LEADS } from "@/core/graphql/lead/lead.gql";
import Alert from "@/components/ui/alert/Alert";
import { Table, TableBody } from "@/components/ui/table";
import { LeadTableHeader } from "./LeadTableHeader";
import { LeadTableRow, Row } from "./LeadTableRow";
import { LeadTableFooter } from "./LeadTableFooter";
import { PAGE_SIZE, TopCenterLoader, useDebounced } from "./leadHelpers";
import * as XLSX from "xlsx";

/* ----------------------------- GQL shapes ----------------------------- */
type LeadItemGql = {
  id?: string | null;
  // _id removed – GraphQL does not expose $oid
  leadCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  phone?: string | null;
  leadSource?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  firstSeenAt?: string | null;   // NEW
  lastSeenAt?: string | null;    // NEW
  reenterCount?: number | null;  // NEW
  assignedRM?: string | null;
  assignedRm?: { name?: string | null } | null;
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

    // NEW
    dormantOnly?: boolean | null;
    dormantDays?: number | null;
  };
};

type Notice =
  | { variant: "success" | "warning" | "error" | "info"; title: string; message: string }
  | null;

type ViewMode = "pending" | "all" | "dormant";

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
          onKeyDown={(e) => e.key === 'Escape' && onReset()}
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
  })
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
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">Re-enter Count</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">Entered Date</th>
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">Last Entered Date</th>
      </tr>
    </thead>
  );
}

function DormantRow({ r }: { r: Row & { firstSeenAt?: string|null; lastSeenAt?: string|null; reenterCount?: number|null } }) {
  return (
    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5">
      <td className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{r.leadCode ?? "—"}</td>
      <td className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{r.name}</td>
      <td className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{r.phone ?? "—"}</td>
      <td className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{r.source ?? "—"}</td>
      <td className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{r.reenterCount ?? 0}</td>
      <td className="px-5 py-3 text-sm text-gray-600 dark:text-white/70">{r.firstSeenAt ? new Date(r.firstSeenAt).toLocaleDateString() : "—"}</td>
      <td className="px-5 py-3 text-sm text-gray-600 dark:text-white/70">{r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleDateString() : "—"}</td>
    </tr>
  );
}

/* ------------------------------- Table ------------------------------- */
const EMPTY_ITEMS: ReadonlyArray<LeadItemGql> = Object.freeze([]);

export default function LeadDataTable() {
  const client = useApolloClient();

  const [mode, setMode] = useState<ViewMode>("pending");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<Notice>(null);
  const [genDone, setGenDone] = useState(false);

  const isPending = mode === "pending";
  const isDormant = mode === "dormant";

  const dormantDays = Number(import.meta.env.VITE_DORMANT_DAYS ?? 60);

  const variables = useMemo<LeadsQueryVars>(
    () => ({
      args: {
        page,
        pageSize: PAGE_SIZE,
        archived: false,
        status: isPending ? "OPEN" : null,
        search: debouncedSearch || null,

        dormantOnly: isDormant ? true : null,
        dormantDays: isDormant ? dormantDays : null,
      },
    }),
    [page, debouncedSearch, isPending, isDormant, dormantDays]
  );

  const [runLeads, { data, loading, error, previousData, networkStatus }] =
    useLazyQuery<LeadsQueryData, LeadsQueryVars>(LEADS_OPEN, {
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

  const rows: (Row & { firstSeenAt?: string|null; lastSeenAt?: string|null; reenterCount?: number|null })[] = useMemo(
    () =>
      items.map((l) => ({
        id: l.id ?? "", // only use GraphQL id
        leadCode: l.leadCode ?? null,
        name: l.name || [l.firstName, l.lastName].filter(Boolean).join(" ") || "—",
        phone: l.phone ?? null,
        source: l.leadSource ?? null,
        createdAt: l.createdAt ?? null,
        assignedRm: l.assignedRM ?? l.assignedRm?.name ?? null,
        status: l.status ?? null,
        firstSeenAt: l.firstSeenAt ?? null,
        lastSeenAt: l.lastSeenAt ?? null,
        reenterCount: l.reenterCount ?? 0,
      })),
    [items]
  );

  // Selection helpers (unused in Dormant mode)
  const rowKey = (r: Row) => r.id;
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(rowKey(r)));
  const toggleAll = (checked: boolean) => {
    const ids = new Set(rows.map(rowKey));
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
  const [assignLeadsMut, { loading: loadingBatch }] = useMutation(ASSIGN_LEADS);
  const generating = loadingSingle || loadingBatch || networkStatus === 3;

  const onEdit = (r: Row) =>
    setNotice({ variant: "info", title: "Edit Lead", message: `Editing ${r.name} (${r.phone ?? ""})` });
  const onDelete = () =>
    setNotice({ variant: "info", title: "Not Implemented", message: "Contact Admin for need to delete this." });

  const refetchActive = async () => {
    await client.refetchQueries({ include: "active" });
  };

  const generateLead = async () => {
    if (isDormant) return; // not allowed in Dormant view
    try {
      const ids = [...selected];
      const candidates = ids.length ? rows.filter((r) => ids.includes(r.id)) : rows;
      const pendingOnPage = candidates.filter((r) => !r.assignedRm || !r.leadCode).map((r) => r.id);

      if (pendingOnPage.length === 0) {
        setNotice({ variant: "info", title: "Nothing to Generate", message: "All visible leads already have Lead Code & RM." });
        return;
      }
      if (pendingOnPage.length === 1) await assignLeadMut({ variables: { id: pendingOnPage[0] } });
      else await assignLeadsMut({ variables: { ids: pendingOnPage } });

      setSelected(new Set());
      setGenDone(true); setTimeout(() => setGenDone(false), 900);
      setPage(1); await refetchActive();
      setNotice({ variant: "success", title: "Lead Codes Assigned", message: `${pendingOnPage.length} lead(s) were assigned.` });
    } catch (err: unknown) {
      let message = "Unknown error";
      if (err instanceof ApolloError) message = err.graphQLErrors[0]?.message || err.message;
      else if (err instanceof Error) message = err.message;
      setNotice({ variant: "error", title: "Assignment Failed", message });
    }
  };

  // Download XLSX
  const handleDownloadXlsx = () => {
    const chosen = selected.size > 0 && !isDormant ? rows.filter((r) => selected.has(r.id)) : rows;

    const exportRows = isDormant
      ? chosen.map((r) => ({
          "Lead Code": r.leadCode ?? "",
          Name: r.name,
          Phone: r.phone ?? "",
          "Lead Source": r.source ?? "",
          "Re-enter Count": r.reenterCount ?? 0,
          "Entered Date": r.firstSeenAt ?? "",
          "Last Entered Date": r.lastSeenAt ?? "",
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
    XLSX.writeFile(wb, `${isDormant ? "dormant" : "leads"}-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const searchRef = useRef<HTMLInputElement>(null);
  const handleReset = () => {
    setSearch("");
    setSelected(new Set());
    setPage(1);
    requestAnimationFrame(() => {
      searchRef.current?.focus();
      if (searchRef.current) searchRef.current.value = "";
    });
    setNotice({ variant: "success", title: "Filters Cleared", message: "Showing latest leads." });
  };

  const showAdvancedCols = !isDormant && rows.some((l) => !!l.leadCode || !!l.assignedRm);

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <TopCenterLoader show={loading || generating} text={generating ? "Generating…" : "Loading…"} />

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
            Leads ({mode === "pending" ? "Pending Only" : mode === "dormant" ? "Dormant" : "All"})
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
            <option value="pending">Pending</option>
            <option value="all">All</option>
            <option value="dormant">Dormant</option>
          </select>

          <SearchBar
            ref={searchRef}
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            onReset={handleReset}
          />

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
                {rows.map((row) => (
                  <DormantRow key={row.id} r={row} />
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      {loading ? "Loading…" : "No leads to show."}
                    </td>
                  </tr>
                )}
              </TableBody>
            </>
          ) : (
            <>
              <LeadTableHeader
                showAdvancedCols={showAdvancedCols}
                allSelected={rows.length > 0 && allSelected}
                toggleAll={toggleAll}
              />
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {rows.map((row) => {
                  const id = rowKey(row);
                  return (
                    <LeadTableRow
                      key={id}
                      row={row}
                      showAdvancedCols={showAdvancedCols}
                      isSelected={selected.has(id)}
                      onToggle={toggleOne}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={showAdvancedCols ? 8 : 6} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      {loading ? "Loading…" : "No leads to show."}
                    </td>
                  </tr>
                )}
              </TableBody>
            </>
          )}
        </Table>
      </div>

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
    </div>
  );
}
