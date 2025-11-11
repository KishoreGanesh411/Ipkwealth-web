import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";

type ClientRow = {
  leadCode: string;
  name: string;
  leadSource: string;
  clientType: "SIP" | "IAP" | "Both";
  enteredDate: string; // YYYY-MM-DD or DD/MM/YYYY as string
};

const rows: ClientRow[] = [
  { leadCode: "IPK25092006", name: "Kishoreganesh K", leadSource: "Referral", clientType: "SIP", enteredDate: "2025-09-17" },
  { leadCode: "IPK25092007", name: "Anita Sharma", leadSource: "Meta", clientType: "IAP", enteredDate: "2025-09-16" },
  { leadCode: "IPK25092008", name: "Rahul Chopra", leadSource: "Website", clientType: "SIP", enteredDate: "2025-09-16" },
  { leadCode: "IPK25092009", name: "Kabir Singh", leadSource: "Others", clientType: "Both", enteredDate: "2025-09-15" },
  { leadCode: "IPK25092010", name: "Sneha Das", leadSource: "YouTube", clientType: "IAP", enteredDate: "2025-09-14" },
];

export default function RecentClients() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Clients</h3>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Lead Code</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Lead Source</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Client Type</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Entered Date</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <TableRow key={row.leadCode}>
                <TableCell className="py-3 text-gray-700 dark:text-white/80">{row.leadCode}</TableCell>
                <TableCell className="py-3 text-gray-700 dark:text-white/80">{row.name}</TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{row.leadSource}</TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Badge size="sm" color={row.clientType === "SIP" ? "success" : row.clientType === "IAP" ? "primary" : "warning"}>
                    {row.clientType}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{row.enteredDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
