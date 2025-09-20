import { memo } from "react";
import { TableCell, TableHeader, TableRow } from "@/components/ui/table";

export const LeadTableHeader = memo(function LeadTableHeader({
  showAdvancedCols,
  allSelected,
  toggleAll,
}: {
  showAdvancedCols: boolean;
  allSelected: boolean;
  toggleAll: (checked: boolean) => void;
}) {
  return (
    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
      <TableRow>
        {/* <TableCell isHeader className="w-12 px-4 py-3">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded-sm border-gray-300 accent-blue-600 focus:ring-0 outline-none dark:border-white/20"
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
          />
        </TableCell> */}

        {showAdvancedCols && (
          <TableCell
            isHeader
            className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            Lead Code
          </TableCell>
        )}

        <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">
          Name
        </TableCell>
        <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">
          Phone
        </TableCell>
        <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">
          Lead Source
        </TableCell>

        {showAdvancedCols && (
          <TableCell
            isHeader
            className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            Assigned RM
          </TableCell>
        )}

        <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">
          Lead Date
        </TableCell>
        {/* <TableCell isHeader className="px-5 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
          Action
        </TableCell> */}
      </TableRow>
    </TableHeader>
  );
});
