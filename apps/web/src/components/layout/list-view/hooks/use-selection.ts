import { useState, useRef, useEffect } from "react";

interface UseSelectionParams {
  orderedIds: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

interface UseSelectionReturn {
  selectedIds: Set<string>;
  handleSelect: (id: string, shiftKey: boolean, metaKey: boolean) => void;
  handleSelectAll: () => void;
  clearSelection: () => void;
  setSelection: (ids: string[]) => void;
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

export function useSelection({
  orderedIds,
  onSelectionChange,
}: UseSelectionParams): UseSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const anchorIdRef = useRef<string | null>(null);

  // Call onSelectionChange when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedIds));
    }
  }, [selectedIds, onSelectionChange]);

  const handleSelect = (id: string, shiftKey: boolean, metaKey: boolean) => {
    if (shiftKey) {
      // Shift-click: select range
      const anchorId = anchorIdRef.current ?? orderedIds[0];
      const anchorIndex = orderedIds.indexOf(anchorId);
      const clickedIndex = orderedIds.indexOf(id);

      if (anchorIndex !== -1 && clickedIndex !== -1) {
        const start = Math.min(anchorIndex, clickedIndex);
        const end = Math.max(anchorIndex, clickedIndex);
        const rangeIds = orderedIds.slice(start, end + 1);

        setSelectedIds(new Set(rangeIds));
      }
    } else if (metaKey) {
      // Meta-click: toggle in selection
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      anchorIdRef.current = id;
    } else {
      // Plain click: replace selection with this item
      setSelectedIds(new Set([id]));
      anchorIdRef.current = id;
    }
  };

  const handleSelectAll = () => {
    const allSelected = orderedIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orderedIds));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const setSelection = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const isSelected = (id: string) => selectedIds.has(id);

  const isAllSelected =
    orderedIds.length > 0 && orderedIds.every((id) => selectedIds.has(id));

  const isIndeterminate =
    selectedIds.size > 0 &&
    selectedIds.size < orderedIds.length &&
    orderedIds.some((id) => selectedIds.has(id));

  return {
    selectedIds,
    handleSelect,
    handleSelectAll,
    clearSelection,
    setSelection,
    isSelected,
    isAllSelected,
    isIndeterminate,
  };
}
