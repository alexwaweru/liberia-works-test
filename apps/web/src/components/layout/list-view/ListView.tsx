import { useState, useMemo } from "react";
import { cn } from "../../../lib/utils";
import { TableView } from "./table-view";
import { CardView } from "./card-view";
import { ListViewToolbar } from "./ListViewToolbar";
import { ListViewStatusBar } from "./ListViewStatusBar";
import { ListViewSplitPane } from "./ListViewSplitPane";
import { ListViewEmptyState } from "./ListViewEmptyState";
import { useSelection } from "./hooks/use-selection";
import { useSorting } from "./hooks/use-sorting";
import { useFiltering } from "./hooks/use-filtering";
import { useColumnVisibility } from "./hooks/use-column-visibility";
import { useListViewKeyboard } from "./hooks/use-list-view-keyboard";
import type { ListViewProps, ListItem } from "./types";

const DEFAULT_COLUMNS = [{ key: "name", label: "Name", sortable: true }];

export function ListView({
  items,
  view,
  onViewChange,
  columns = DEFAULT_COLUMNS,
  onSelectionChange,
  onItemOpen,
  onSortChange,
  allowSplitView = false,
  contextMenuActions,
  renderDetail,
  cardDensity = "regular",
  onCardDensityChange,
  onReorder,
  virtualizeThreshold,
  toolbarLeft,
  searchPlaceholder,
  emptyState,
  footer,
  renderCard,
  className,
}: ListViewProps) {
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);

  // Filtering
  const { searchValue, setSearchValue, filterItems } = useFiltering();

  // Column visibility
  const { visibleColumns, allColumns, toggleColumn } = useColumnVisibility(columns);

  // Sorting
  const { sort, toggleSort, sortItems } = useSorting({ onSortChange });

  // Data pipeline: items → filter → sort
  const filteredItems = useMemo(
    () => filterItems(items, visibleColumns),
    [filterItems, items, visibleColumns]
  );
  const processedItems = useMemo(
    () => sortItems(filteredItems),
    [sortItems, filteredItems]
  );

  // Ordered IDs from processed items for selection
  const orderedIds = useMemo(
    () => processedItems.map((item) => item.id),
    [processedItems]
  );

  // Selection
  const { selectedIds, handleSelect, handleSelectAll, clearSelection } =
    useSelection({
      orderedIds,
      onSelectionChange,
    });

  // Determine the selected item for split pane detail
  const selectedItem = useMemo((): ListItem | null => {
    const selectedArray = Array.from(selectedIds);
    // Find the last selected id that still exists in the processed items
    for (let i = selectedArray.length - 1; i >= 0; i--) {
      const found = processedItems.find((item) => item.id === selectedArray[i]);
      if (found) return found;
    }
    return null;
  }, [selectedIds, processedItems]);

  // Keyboard shortcuts
  const { containerRef, handleKeyDown } = useListViewKeyboard({
    onSelectAll: handleSelectAll,
    onClearSelection: clearSelection,
    onOpenSelected: () => {
      if (selectedItem && onItemOpen) {
        onItemOpen(selectedItem);
      }
    },
  });

  // Sort handler that wraps the toggle for the header
  const handleSortChange = (newSort: { columnKey: string; direction: "asc" | "desc" } | null) => {
    if (newSort) {
      toggleSort(newSort.columnKey);
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="list-view"
      data-slot="list-view"
      role="region"
      aria-label="List view"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cn("flex flex-col", className)}
    >
      <ListViewToolbar
        view={view}
        onViewChange={onViewChange}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        columns={view === "table" ? allColumns : undefined}
        onColumnVisibilityChange={view === "table" ? toggleColumn : undefined}
        allowSplitView={allowSplitView}
        isSplitViewOpen={isSplitViewOpen}
        onSplitViewToggle={() => setIsSplitViewOpen((prev) => !prev)}
        cardDensity={view === "card" ? cardDensity : undefined}
        onCardDensityChange={view === "card" ? onCardDensityChange : undefined}
        toolbarLeft={toolbarLeft}
        searchPlaceholder={searchPlaceholder}
      />

      <ListViewSplitPane
        isOpen={isSplitViewOpen && allowSplitView}
        renderDetail={renderDetail ?? (() => null)}
        selectedItem={selectedItem}
        className="flex-1 min-h-0"
      >
        <div className="flex-1 min-h-0 overflow-auto transition-opacity duration-150">
          {processedItems.length === 0 ? (
            typeof emptyState === "function"
              ? emptyState({ isFiltered: items.length > 0 && processedItems.length === 0 })
              : emptyState ?? <ListViewEmptyState isFiltered={items.length > 0 && processedItems.length === 0} />
          ) : view === "table" ? (
            <TableView
              items={processedItems}
              columns={visibleColumns}
              sort={sort}
              onSortChange={handleSortChange}
              selectedIds={selectedIds}
              onSelectionAction={(action) => {
                switch (action.type) {
                  case "select":
                    handleSelect(action.id, action.shiftKey, action.metaKey);
                    break;
                  case "select-all":
                    handleSelectAll();
                    break;
                  case "clear":
                    clearSelection();
                    break;
                }
              }}
              onItemOpen={onItemOpen}
              contextMenuActions={contextMenuActions}
              virtualizeThreshold={virtualizeThreshold}
            />
          ) : (
            <CardView
              items={processedItems}
              density={cardDensity}
              renderCard={renderCard}
              selectedIds={selectedIds}
              onSelectionAction={(action) => {
                switch (action.type) {
                  case "select":
                    handleSelect(action.id, action.shiftKey, action.metaKey);
                    break;
                  case "select-all":
                    handleSelectAll();
                    break;
                  case "clear":
                    clearSelection();
                    break;
                }
              }}
              onItemOpen={onItemOpen}
              contextMenuActions={contextMenuActions}
              onReorder={onReorder}
              virtualizeThreshold={virtualizeThreshold}
            />
          )}
        </div>
      </ListViewSplitPane>

      {footer ?? (
        <ListViewStatusBar
          totalCount={items.length}
          filteredCount={processedItems.length}
          selectedCount={selectedIds.size}
        />
      )}
    </div>
  );
}
