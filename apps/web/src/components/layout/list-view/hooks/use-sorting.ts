import { useState, useEffect } from "react";
import type { SortState, ListItem } from "../types";

interface UseSortingParams {
  onSortChange?: (sort: SortState | null) => void;
}

interface UseSortingReturn {
  sort: SortState | null;
  toggleSort: (columnKey: string) => void;
  clearSort: () => void;
  sortItems: (items: ListItem[]) => ListItem[];
}

export function useSorting({
  onSortChange,
}: UseSortingParams): UseSortingReturn {
  const [sort, setSort] = useState<SortState | null>(null);

  // Call onSortChange when sort changes
  useEffect(() => {
    if (onSortChange) {
      onSortChange(sort);
    }
  }, [sort, onSortChange]);

  const toggleSort = (columnKey: string) => {
    setSort((prev) => {
      if (!prev || prev.columnKey !== columnKey) {
        // New column: start with asc
        return { columnKey, direction: "asc" };
      }

      if (prev.direction === "asc") {
        // Same column, asc → desc
        return { columnKey, direction: "desc" };
      }

      // Same column, desc → null
      return null;
    });
  };

  const clearSort = () => {
    setSort(null);
  };

  const sortItems = (items: ListItem[]): ListItem[] => {
    if (!sort) {
      return items;
    }

    const { columnKey, direction } = sort;

    // Create a shallow copy to avoid mutation
    const sorted = [...items];

    sorted.sort((a, b) => {
      const aValue = columnKey === "name" ? a.name : a.metadata[columnKey];
      const bValue = columnKey === "name" ? b.name : b.metadata[columnKey];

      // Handle null/undefined values - always sort to end
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;

      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else {
        // Mixed types or other types: convert to string
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  };

  return {
    sort,
    toggleSort,
    clearSort,
    sortItems,
  };
}
