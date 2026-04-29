import { useRef } from "react";
import type React from "react";

export interface UseListViewKeyboardParams {
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenSelected: () => void;
}

export function useListViewKeyboard({
  onSelectAll,
  onClearSelection,
  onOpenSelected,
}: UseListViewKeyboardParams) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl+A: Select all
    if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSelectAll();
      return;
    }

    // Escape: Clear selection
    if (e.key === "Escape") {
      onClearSelection();
      return;
    }

    // Enter: Open selected
    if (e.key === "Enter") {
      onOpenSelected();
      return;
    }
  };

  return {
    containerRef,
    handleKeyDown,
  };
}
