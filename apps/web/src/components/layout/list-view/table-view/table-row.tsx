import type React from "react";
import { Checkbox } from "../../../ui/checkbox";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "../../../ui/context-menu";
import type { TableRowProps } from "../types";

export function TableRow({
  item,
  columns,
  isSelected,
  onSelect,
  onItemOpen,
  contextMenuActions,
  selectedItems,
}: TableRowProps) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item.id, false, false);
  };

  const handleRowClick = (e: React.MouseEvent) => {
    onSelect(item.id, e.shiftKey, e.metaKey || e.ctrlKey);
  };

  const handleRowDoubleClick = () => {
    onItemOpen?.(item);
  };

  const handleRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onItemOpen?.(item);
    } else if (e.key === " ") {
      e.preventDefault();
      onSelect(item.id, e.shiftKey, e.metaKey || e.ctrlKey);
    }
  };

  const visibleColumns = columns.filter((col) => col.visible !== false);

  const row = (
    <tr
      data-slot="table-row"
      data-state={isSelected ? "selected" : undefined}
      aria-selected={isSelected}
      tabIndex={0}
      className={`border-b border-border/60 last:border-0 ${isSelected ? "bg-accent" : "hover:bg-muted/50"} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset`}
      onClick={handleRowClick}
      onDoubleClick={handleRowDoubleClick}
      onKeyDown={handleRowKeyDown}
    >
      <td className="w-10 px-3 py-3.5" onClick={handleCheckboxClick}>
        <Checkbox
          checked={isSelected}
          aria-label={`Select ${item.name}`}
          tabIndex={-1}
        />
      </td>
      {visibleColumns.map((column) => {
        let value: unknown;
        if (column.key === "name") {
          value = item.name;
        } else {
          value = item.metadata[column.key];
        }

        const content = column.render ? column.render(value, item) : String(value ?? "");

        return (
          <td key={column.key} className="px-4 py-3.5 text-sm">
            {content}
          </td>
        );
      })}
    </tr>
  );

  if (!contextMenuActions || contextMenuActions.length === 0) {
    return row;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
      <ContextMenuContent>
        {contextMenuActions.map((action) => (
          <ContextMenuItem
            key={action.id}
            onClick={() => action.onAction(selectedItems)}
            variant={action.destructive ? "destructive" : "default"}
            disabled={action.disabled}
          >
            {action.icon && <span aria-hidden="true">{action.icon}</span>}
            {action.label}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
