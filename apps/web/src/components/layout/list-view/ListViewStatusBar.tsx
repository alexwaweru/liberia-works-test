import type { ListViewStatusBarProps } from "./types";
import { cn } from "@/lib/utils";

export function ListViewStatusBar({
  totalCount,
  filteredCount,
  selectedCount,
  className,
}: ListViewStatusBarProps) {
  const isFiltered = filteredCount < totalCount;

  let text = isFiltered ? `${filteredCount} of ${totalCount} items` : `${totalCount} items`;

  if (selectedCount > 0) {
    text += ` · ${selectedCount} selected`;
  }

  return (
    <div
      data-slot="list-view-status-bar"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn("text-muted-foreground text-xs px-2 py-1", className)}
    >
      {text}
    </div>
  );
}
