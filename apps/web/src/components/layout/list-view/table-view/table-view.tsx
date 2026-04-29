import { cn } from "@/lib/utils";
import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";
import type { TableViewProps } from "../types";

export function TableView({
  items,
  columns,
  sort,
  onSortChange,
  selectedIds,
  onSelectionAction,
  onItemOpen,
  contextMenuActions,
  className,
}: TableViewProps) {
  const allItemIds = items.map((item) => item.id);
  const selectedItems = items.filter((item) => selectedIds.has(item.id));

  const handleSelect = (id: string, shiftKey: boolean, metaKey: boolean) => {
    onSelectionAction({ type: "select", id, shiftKey, metaKey });
  };

  return (
    <div data-testid="table-view" data-slot="table-view" className={cn("overflow-auto", className)}>
      <table className="w-full border-collapse text-sm" aria-label="Items list">
        <TableHeader
          columns={columns}
          sort={sort}
          onSortChange={onSortChange}
          allItemIds={allItemIds}
          selectedIds={selectedIds}
          onSelectionAction={onSelectionAction}
        />
        <tbody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              item={item}
              columns={columns}
              isSelected={selectedIds.has(item.id)}
              onSelect={handleSelect}
              onItemOpen={onItemOpen}
              contextMenuActions={contextMenuActions}
              selectedItems={selectedItems}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
