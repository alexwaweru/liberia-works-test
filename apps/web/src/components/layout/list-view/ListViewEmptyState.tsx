import { PackageOpen, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListViewEmptyStateProps } from "./types";

export function ListViewEmptyState({
  isFiltered,
  className,
}: ListViewEmptyStateProps) {
  return (
    <div
      role="status"
      data-testid="list-view-empty-state"
      className={cn(
        "flex flex-col items-center justify-center py-16 text-muted-foreground",
        className,
      )}
    >
      {isFiltered ? (
        <>
          <SearchX className="size-12 mb-4" strokeWidth={1} />
          <p className="text-sm font-medium">No matching results found.</p>
          <p className="text-xs mt-1">Try adjusting your search terms.</p>
        </>
      ) : (
        <>
          <PackageOpen className="size-12 mb-4" strokeWidth={1} />
          <p className="text-sm font-medium">No entries were found.</p>
        </>
      )}
    </div>
  );
}
