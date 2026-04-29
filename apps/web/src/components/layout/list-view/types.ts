import type React from "react";

// Core data types
export interface ListItem {
  id: string;
  name: string;
  thumbnail?: string;
  metadata: Record<string, unknown>;
}

export type ViewMode = "table" | "card";
export type CardDensity = "compact" | "regular" | "expanded";
export type SortDirection = "asc" | "desc";

export interface SortState {
  columnKey: string;
  direction: SortDirection;
}

// Column configuration
export interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean; // default true
  visible?: boolean; // default true
  width?: string; // CSS width like "200px" or "1fr"
  render?: (value: unknown, item: ListItem) => React.ReactNode;
}

// Context menu
export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onAction: (items: ListItem[]) => void;
}

// Selection
export type SelectionAction =
  | { type: "select"; id: string; shiftKey: boolean; metaKey: boolean }
  | { type: "select-all"; ids: string[] }
  | { type: "clear" }
  | { type: "set"; ids: string[] };

// Empty state
export interface ListViewEmptyStateProps {
  isFiltered: boolean;
  className?: string;
}

// Component Props
export interface ListViewProps {
  items: ListItem[];
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  columns?: ColumnConfig[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onItemOpen?: (item: ListItem) => void;
  onSortChange?: (sort: SortState | null) => void;
  allowSplitView?: boolean;
  contextMenuActions?: ContextMenuAction[];
  renderDetail?: (item: ListItem) => React.ReactNode;
  cardDensity?: CardDensity;
  onCardDensityChange?: (density: CardDensity) => void;
  onReorder?: (ids: string[]) => void;
  virtualizeThreshold?: number; // default 100; only virtualize when item count exceeds this
  toolbarLeft?: React.ReactNode;
  searchPlaceholder?: string;
  emptyState?: React.ReactNode | ((context: { isFiltered: boolean }) => React.ReactNode);
  footer?: React.ReactNode;
  renderCard?: RenderCardFn;
  className?: string;
}

export interface TableViewProps {
  items: ListItem[];
  columns: ColumnConfig[];
  sort: SortState | null;
  onSortChange: (sort: SortState | null) => void;
  selectedIds: Set<string>;
  onSelectionAction: (action: SelectionAction) => void;
  onItemOpen?: (item: ListItem) => void;
  contextMenuActions?: ContextMenuAction[];
  virtualizeThreshold?: number;
  className?: string;
}

export interface TableHeaderProps {
  columns: ColumnConfig[];
  sort: SortState | null;
  onSortChange: (sort: SortState | null) => void;
  allItemIds: string[];
  selectedIds: Set<string>;
  onSelectionAction: (action: SelectionAction) => void;
}

export interface TableRowProps {
  item: ListItem;
  columns: ColumnConfig[];
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean, metaKey: boolean) => void;
  onItemOpen?: (item: ListItem) => void;
  contextMenuActions?: ContextMenuAction[];
  selectedItems: ListItem[];
}

export type RenderCardFn = (
  item: ListItem,
  helpers: { onOpen: () => void }
) => React.ReactNode;

export interface CardViewProps {
  items: ListItem[];
  density: CardDensity;
  selectedIds: Set<string>;
  onSelectionAction: (action: SelectionAction) => void;
  onItemOpen?: (item: ListItem) => void;
  contextMenuActions?: ContextMenuAction[];
  onReorder?: (ids: string[]) => void;
  virtualizeThreshold?: number;
  renderCard?: RenderCardFn;
  className?: string;
}

export interface CardItemProps {
  item: ListItem;
  density: CardDensity;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean, metaKey: boolean) => void;
  onItemOpen?: (item: ListItem) => void;
  contextMenuActions?: ContextMenuAction[];
  selectedItems: ListItem[];
  renderCard?: RenderCardFn;
}

export interface ListViewToolbarProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  columns?: ColumnConfig[];
  onColumnVisibilityChange?: (key: string) => void;
  allowSplitView: boolean;
  isSplitViewOpen: boolean;
  onSplitViewToggle: () => void;
  cardDensity?: CardDensity;
  onCardDensityChange?: (density: CardDensity) => void;
  toolbarLeft?: React.ReactNode;
  searchPlaceholder?: string;
  className?: string;
}

export interface ListViewStatusBarProps {
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  className?: string;
}

export interface ListViewSplitPaneProps {
  isOpen: boolean;
  renderDetail: (item: ListItem) => React.ReactNode;
  selectedItem: ListItem | null;
  children: React.ReactNode;
  className?: string;
}
