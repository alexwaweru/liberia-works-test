import { cn } from "@/lib/utils";
import type { ListViewSplitPaneProps } from "./types";

export function ListViewSplitPane({
  isOpen,
  renderDetail,
  selectedItem,
  children,
  className,
}: ListViewSplitPaneProps) {
  if (!isOpen) {
    return (
      <div data-slot="list-view-split-pane" className={cn("flex flex-col", className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      data-slot="list-view-split-pane"
      className={cn("grid grid-cols-2 gap-0", className)}
    >
      <div className="overflow-auto border-r">{children}</div>
      <div
        role="complementary"
        aria-label="Item detail"
        className="overflow-auto p-4"
      >
        {selectedItem ? (
          renderDetail(selectedItem)
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Select an item to view details
          </div>
        )}
      </div>
    </div>
  );
}
