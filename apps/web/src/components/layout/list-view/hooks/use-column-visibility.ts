import { useMemo, useReducer, useEffect } from "react";
import type { ColumnConfig } from "../types";

interface State {
  columnsKey: string;
  visibilityMap: Map<string, boolean>;
}

type Action =
  | { type: "TOGGLE"; key: string }
  | { type: "RESET"; columns: ColumnConfig[] };

function createInitialState(columns: ColumnConfig[]): State {
  const columnsKey = columns.map((c) => c.key).join(",");
  const visibilityMap = new Map<string, boolean>();
  columns.forEach((col) => {
    visibilityMap.set(col.key, col.visible !== false);
  });
  return { columnsKey, visibilityMap };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "TOGGLE": {
      const currentVisible = state.visibilityMap.get(action.key) ?? false;
      const visibleCount = Array.from(state.visibilityMap.values()).filter(
        Boolean
      ).length;

      // Prevent hiding the last visible column
      if (currentVisible && visibleCount === 1) {
        return state;
      }

      const newMap = new Map(state.visibilityMap);
      newMap.set(action.key, !currentVisible);
      return { ...state, visibilityMap: newMap };
    }
    case "RESET": {
      return createInitialState(action.columns);
    }
    default:
      return state;
  }
}

export function useColumnVisibility(columns: ColumnConfig[]) {
  const [state, dispatch] = useReducer(reducer, columns, createInitialState);

  // Derive current columns key
  const currentColumnsKey = useMemo(
    () => columns.map((c) => c.key).join(","),
    [columns]
  );

  // Reset state if columns prop changed (effect runs after render)
  useEffect(() => {
    if (state.columnsKey !== currentColumnsKey) {
      dispatch({ type: "RESET", columns });
    }
  }, [columns, currentColumnsKey, state.columnsKey]);

  const toggleColumn = (key: string) => {
    dispatch({ type: "TOGGLE", key });
  };

  const isColumnVisible = (key: string): boolean => {
    return state.visibilityMap.get(key) ?? false;
  };

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => state.visibilityMap.get(col.key) !== false);
  }, [columns, state.visibilityMap]);

  const allColumns = useMemo(() => {
    return columns.map((col) => ({
      ...col,
      visible: state.visibilityMap.get(col.key) !== false,
    }));
  }, [columns, state.visibilityMap]);

  return {
    visibleColumns,
    allColumns,
    toggleColumn,
    isColumnVisible,
  };
}
