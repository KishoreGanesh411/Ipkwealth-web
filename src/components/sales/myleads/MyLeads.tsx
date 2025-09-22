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

export type Lead = {
  id: string | number;
  leadCode: string | null;
  name: string;
  leadSource: string;
  product: string;
  profession: string;
};

export type MyLeadsProps = {
  leads?: Lead[];
  pageSize?: number;
};

export default function MyLeads({ leads, pageSize = 8 }: MyLeadsProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [menuFor, setMenuFor] = useState<string | number | null>(null);

  const list = Array.isArray(leads) ? leads : [];

  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((l) =>
      [l.leadCode ?? "", l.name, l.leadSource, l.product, l.profession]
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

  const openMenu = (id: string | number) =>
    setMenuFor((prev) => (prev === id ? null : id));

  const goViewLead = (lead: Lead) => {
    setMenuFor(null);
    navigate(`/sales/view_lead/${lead.id}`, { state: { lead } }); // programmatic nav
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">latest leads</h2>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search..."
          className="h-10 w-64 rounded-xl border border-gray-200 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-hidden focus:ring-3 focus:ring-indigo-500/10 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30"
        />
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader className="text-left text-sm text-gray-500 dark:text-white/50">
            <TableRow>
              <TableCell isHeader className="px-6 py-3 font-medium">Name</TableCell>
              <TableCell isHeader className="px-6 py-3 font-medium">Lead Code</TableCell>
              <TableCell isHeader className="px-6 py-3 font-medium">Lead Source</TableCell>
              <TableCell isHeader className="px-6 py-3 font-medium">Product</TableCell>
              <TableCell isHeader className="px-6 py-3 font-medium">Profession</TableCell>
              <TableCell isHeader className="px-6 py-3 font-medium" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {current.map((l) => (
              <TableRow key={l.id} className="border-t border-gray-100 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/[0.03]">
                <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-white">{l.name}</TableCell>
                <TableCell className="px-6 py-4"><LeadCodeBadge code={l.leadCode ?? "—"} /></TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{l.leadSource}</TableCell>
                <TableCell className="px-6 py-4"><Badge className="rounded-full px-2.5 py-1 text-xs">{l.product}</Badge></TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{l.profession}</TableCell>

                <TableCell className="relative px-6 py-4 text-right">
                  <button
                    onClick={() => openMenu(l.id)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10"
                    aria-haspopup="menu"
                    aria-expanded={menuFor === l.id}
                    aria-label="Row actions"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </button>

                  {menuFor === l.id && (
                    <div
                      className="absolute right-4 z-20 mt-2 w-40 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg dark:border-white/10 dark:bg-white/[0.02]"
                      onMouseLeave={() => setMenuFor(null)}
                      role="menu"
                    >
                      <button
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                        onClick={() => goViewLead(l)}
                        role="menuitem"
                      >
                        View More
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {current.length === 0 && (
              <TableRow>
                <TableCell className="px-6 py-10 text-center text-sm text-gray-500 dark:text-white/50" colSpan={6}>
                  No leads to show
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 py-4">
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
                className={isActive
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
