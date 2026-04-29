import type React from "react";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Checkbox } from "../../../ui/checkbox";
import type { TableHeaderProps } from "../types";

export function TableHeader({
  columns,
  sort,
  onSortChange,
  allItemIds,
  selectedIds,
  onSelectionAction,
}: TableHeaderProps) {
  const allSelected = allItemIds.length > 0 && selectedIds.size === allItemIds.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < allItemIds.length;

  const handleSelectAll = () => {
    onSelectionAction({ type: "select-all", ids: allItemIds });
  };

  const handleSort = (columnKey: string) => {
    if (sort?.columnKey === columnKey) {
      if (sort.direction === "asc") {
        onSortChange({ columnKey, direction: "desc" });
      } else {
        onSortChange(null);
      }
    } else {
      onSortChange({ columnKey, direction: "asc" });
    }
  };

  const handleSortKeyDown = (e: React.KeyboardEvent, columnKey: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSort(columnKey);
    }
  };

  const visibleColumns = columns.filter((col) => col.visible !== false);

  return (
    <thead data-slot="table-header">
      <tr className="bg-muted/50">
        <th scope="col" className="w-10 px-2 py-2">
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
          />
        </th>
        {visibleColumns.map((column) => {
          const isSortable = column.sortable !== false;
          const isSorted = sort?.columnKey === column.key;
          const sortDirection = isSorted ? sort.direction : null;

          const ariaSort = isSorted
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : isSortable
              ? "none"
              : undefined;

          return (
            <th
              key={column.key}
              scope="col"
              className={`px-4 py-2 text-left text-muted-foreground text-xs font-medium ${
                isSortable ? "cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : ""
              }`}
              onClick={isSortable ? () => handleSort(column.key) : undefined}
              onKeyDown={isSortable ? (e) => handleSortKeyDown(e, column.key) : undefined}
              tabIndex={isSortable ? 0 : undefined}
              aria-sort={ariaSort}
              style={column.width ? { width: column.width } : undefined}
            >
              <div className="flex items-center gap-1">
                {column.label}
                {isSortable && isSorted && (
                  <span aria-hidden="true" className="text-foreground">
                    {sortDirection === "asc" ? (
                      <ArrowUpIcon className="size-3.5" />
                    ) : (
                      <ArrowDownIcon className="size-3.5" />
                    )}
                  </span>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
