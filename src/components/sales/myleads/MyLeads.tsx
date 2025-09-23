import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import LeadCodeBadge from "@/components/common/LeadCodeBadge";
import { Lead, MyLeadsProps } from "./interface/type";


/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */
export default function MyLeads({ leads, pageSize = 8 }: MyLeadsProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const list = Array.isArray(leads) ? leads : [];

  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((l) =>
      [
        l.email ?? "",
        l.name,
        l.leadCode ?? "",
        l.leadSource,
        l.gender ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [list, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const goViewLead = (lead: Lead) => {
    navigate(`/sales/view_lead/${lead.id}`, { state: { lead } });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Recent Leads
          </h2>
          <span className="text-xs text-gray-400">({list.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* optional: Filter/See all buttons can be added later */}
          <div role="search" aria-label="Search leads">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search…"
              className="h-10 w-[18rem] rounded-xl border border-gray-200 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-hidden focus:ring-3 focus:ring-indigo-500/10 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-full">
          {/* Helpful for screen readers */}
          <caption className="sr-only">List of recently assigned leads</caption>

          <TableHeader className="text-left text-sm text-gray-500 dark:text-white/60">
            <TableRow>
              <TableCell isHeader className="px-6 py-3 font-medium">
                Customer
              </TableCell>
              <TableCell isHeader className="px-6 py-3 font-medium">
                Lead Code
              </TableCell>
              <TableCell isHeader className="px-6 py-3 font-medium">
                Lead Source
              </TableCell>
              <TableCell isHeader className="px-6 py-3 font-medium">
                Gender
              </TableCell>
              <TableCell isHeader className="px-6 py-3 font-medium text-right">
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {current.map((l) => (
              <TableRow
                key={l.id}
                className="border-t border-gray-100 transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/[0.03]"
              >
                {/* Customer cell: email on top, name under it */}
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* Simple initial avatar */}
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                      {initials(l.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-gray-500 dark:text-gray-300">
                        {l.email ?? "—"}
                      </div>
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {l.name}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Lead code as your badge */}
                <TableCell className="px-6 py-4">
                  <LeadCodeBadge code={l.leadCode ?? "—"} />
                </TableCell>

                {/* Lead source as a subtle badge */}
                <TableCell className="px-6 py-4">
                  <Badge className="rounded-full px-2.5 py-1 text-xs">
                    {l.leadSource}
                  </Badge>
                </TableCell>

                {/* Gender */}
                <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {l.gender ?? "—"}
                </TableCell>

                {/* Action: direct View button */}
                <TableCell className="px-6 py-4 text-right">
                  <button
                    onClick={() => goViewLead(l)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                  >
                    View
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </TableCell>
              </TableRow>
            ))}

            {current.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-500 dark:text-white/50"
                >
                  No leads to show
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => {
            const n = i + 1;
            const isActive = n === page;
            return (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={
                  isActive
                    ? "rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white"
                    : "rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                }
              >
                {n}
              </button>
            );
          })}
        </div>

        <button
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   local helpers
   ──────────────────────────────────────────────────────────── */
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}
