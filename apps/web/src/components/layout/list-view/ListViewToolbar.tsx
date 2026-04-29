import {
  Search,
  List,
  LayoutGrid,
  SlidersHorizontal,
  PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ListViewToolbarProps } from "./types";

export function ListViewToolbar({
  view,
  onViewChange,
  searchValue,
  onSearchChange,
  columns,
  onColumnVisibilityChange,
  allowSplitView,
  isSplitViewOpen,
  onSplitViewToggle,
  cardDensity,
  onCardDensityChange,
  toolbarLeft,
  searchPlaceholder,
  className,
}: ListViewToolbarProps) {
  return (
    <div
      data-slot="list-view-toolbar"
      role="toolbar"
      aria-label="List view controls"
      className={cn("flex items-center gap-2 px-2 py-1.5", className)}
    >
      {/* Left slot */}
      {toolbarLeft}

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder ?? "Search..."}
          aria-label={searchPlaceholder ?? "Search items"}
          className="pl-8 h-8"
        />
      </div>

      {/* View toggle: two buttons side by side */}
      <div className="flex items-center rounded-md border" role="group" aria-label="View mode">
        <Button
          variant={view === "table" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("table")}
          aria-label="Table view"
          aria-pressed={view === "table"}
          className="rounded-r-none h-8"
        >
          <List className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant={view === "card" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("card")}
          aria-label="Card view"
          aria-pressed={view === "card"}
          className="rounded-l-none h-8"
        >
          <LayoutGrid className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Column visibility (table view only) */}
      {view === "table" && columns && onColumnVisibilityChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              aria-label="Toggle columns"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={col.visible !== false}
                onCheckedChange={() => onColumnVisibilityChange(col.key)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Density picker (card view only) */}
      {view === "card" && cardDensity && onCardDensityChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              aria-label="Card density"
            >
              <LayoutGrid className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(["compact", "regular", "expanded"] as const).map((d) => (
              <DropdownMenuItem
                key={d}
                onClick={() => onCardDensityChange(d)}
                className={cardDensity === d ? "bg-accent" : ""}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Split view toggle */}
      {allowSplitView && (
        <Button
          variant={isSplitViewOpen ? "secondary" : "outline"}
          size="sm"
          className="h-8"
          onClick={onSplitViewToggle}
          aria-label="Toggle split view"
          aria-pressed={isSplitViewOpen}
        >
          <PanelRight className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
