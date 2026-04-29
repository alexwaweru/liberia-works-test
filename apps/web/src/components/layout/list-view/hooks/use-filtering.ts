import { useState, useEffect } from "react";
import type { ListItem, ColumnConfig } from "../types";
import { FILTER_DEBOUNCE_MS } from "../constants";

export function useFiltering() {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, FILTER_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const filterItems = (
    items: ListItem[],
    columns?: ColumnConfig[]
  ): ListItem[] => {
    if (!debouncedValue.trim()) {
      return items;
    }

    const searchLower = debouncedValue.toLowerCase();

    return items.filter((item) => {
      // Check item name
      if (item.name.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Check visible column metadata values
      if (columns) {
        const visibleColumns = columns.filter((col) => col.visible !== false);

        for (const col of visibleColumns) {
          const value = item.metadata[col.key];

          // Only search string and number values
          if (typeof value === "string" || typeof value === "number") {
            if (String(value).toLowerCase().includes(searchLower)) {
              return true;
            }
          }
        }
      }

      return false;
    });
  };

  return {
    searchValue,
    setSearchValue,
    filterItems,
  };
}
