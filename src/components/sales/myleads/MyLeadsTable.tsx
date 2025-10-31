import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table/index"
import LeadStatusBadge from "./LeadStatusBadge";
import ClientTypeBadge from "./ClientTypeBadge";
import { humanize } from "@/utils/formatters";

type LeadRow = {
  id: string | number;
  leadCode: string;
  name: string;
  leadSource?: string | null;
  product?: string | null;
  clientTypes?: string | null | string[];
  status?: string | null;
  createdAt?: string | null;
};


export default function MyLeadsTable({ rows = [] }: { rows?: LeadRow[] }) {
  const fmtDate = (d?: string | null) => (d ? String(d).slice(0, 10) : "-");
  const firstType = (v?: string | string[] | null) =>
    Array.isArray(v) ? v[0] : v || undefined;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">My Leads</h3>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <svg
              className="stroke-current fill-white dark:fill-gray-800"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2.29 5.904h15.417" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17.708 14.096H2.291" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.083 3.333a2.57 2.57 0 1 1 0 5.141 2.57 2.57 0 0 1 0-5.141Z" strokeWidth="1.5" />
              <path d="M7.917 11.525a2.571 2.571 0 1 0 0 5.142 2.571 2.571 0 0 0 0-5.142Z" strokeWidth="1.5" />
            </svg>
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Lead Code
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Name
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Lead Source
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Product
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Client Type
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Status
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Created At
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {(rows || []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="py-3 text-start text-theme-sm text-gray-800 dark:text-white/90">
                  {r.leadCode}
                </TableCell>
                <TableCell className="py-3 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                  {r.name}
                </TableCell>
                <TableCell className="py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {humanize(r.leadSource || "") || "-"}
                </TableCell>
                <TableCell className="py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {humanize(r.product || "") || "-"}
                </TableCell>
                <TableCell className="py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  <ClientTypeBadge type={firstType(r.clientTypes)} />
                </TableCell>
                <TableCell className="py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  <LeadStatusBadge status={r.status || "PENDING"} />
                </TableCell>
                <TableCell className="py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {fmtDate(r.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
