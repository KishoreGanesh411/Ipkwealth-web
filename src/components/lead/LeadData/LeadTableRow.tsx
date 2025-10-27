// import { PencilIcon, TrashBinIcon } from "@/icons/index";
import React, { useMemo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import Select from "@/components/form/Select";

export type Row = {
  id: string;
  leadCode?: string | null;
  name: string;
  phone?: string | null;
  source?: string | null;
  createdAt?: string | null;
  assignedRm?: string | null;
  assignedRmId?: string | null;
  status?: string | null;
};

export function LeadTableRow({
  row,
  showAdvancedCols,
  canAssignRm,
  rmOptions,
  rmLoading,
  assigning,
  onAssignRm,
  // isSelected,
  // onToggle,
  // onEdit,
  // onDelete,
}: {
  row: Row;
  showAdvancedCols: boolean;
  canAssignRm: boolean;
  rmOptions?: ReadonlyArray<{ value: string; label: string }>;
  rmLoading?: boolean;
  assigning?: boolean;
  onAssignRm: (leadId: string, rmId: string | null) => void;
  isSelected: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onEdit: (r: Row) => void;
  onDelete: () => void;
}) {
  const key = row.id;
  const combinedOptions = useMemo(() => {
    const base = Array.from(rmOptions ?? []);
    if (row.assignedRmId && row.assignedRm) {
      const exists = base.some((opt) => opt.value === row.assignedRmId);
      if (!exists) base.push({ value: row.assignedRmId, label: row.assignedRm });
    }
    // Manual-assign only: no "Auto assign" option in dropdown
    return base;
  }, [rmOptions, row.assignedRmId, row.assignedRm]);
  const selectedValue = row.assignedRmId ?? "";

  return (
    <TableRow key={key}>
      {/* <TableCell className="w-12 px-4 py-4">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 rounded-sm border-gray-300 accent-blue-600 focus:ring-0 outline-none dark:border-white/20"
          checked={isSelected}
          onChange={(e) => onToggle(key, e.target.checked)}
        />
      </TableCell> */}

      {showAdvancedCols && (
        <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
          {row.leadCode ?? "—"}
        </TableCell>
      )}

      <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
        {row.name}
      </TableCell>
      <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
        {row.phone ?? "—"}
      </TableCell>
      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
        {row.source ?? "—"}
      </TableCell>

      {showAdvancedCols && (
        <TableCell className="px-5 py-4 text-sm">
          {canAssignRm ? (
            <Select
              options={combinedOptions}
              value={selectedValue}
              onChange={(value: string) => onAssignRm(row.id, value)}
              disabled={rmLoading || assigning}
              className="pl-3"
              placeholder="Assign RM"
            />
          ) : row.assignedRm ? (
            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:border-green-900/40 dark:bg-green-900/30 dark:text-green-300">
              {row.assignedRm}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-300">
              Unassigned
            </span>
          )}
        </TableCell>
      )}

      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
      </TableCell>

      {/* <TableCell className="px-5 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(row)}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
            title="Edit"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
            title="Delete"
          >
            <TrashBinIcon />
          </button>
        </div>
      </TableCell> */}
    </TableRow>
  );
}
