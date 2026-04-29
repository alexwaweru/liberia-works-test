import type { CardDensity } from "./types";

// Card density grid configuration (Tailwind classes)
export const CARD_DENSITY_CONFIG: Record<
  CardDensity,
  { gridCols: string; gap: string }
> = {
  compact: {
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
    gap: "gap-2",
  },
  regular: {
    gridCols: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    gap: "gap-4",
  },
  expanded: {
    gridCols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    gap: "gap-6",
  },
};

// Debounce delay for search filtering (ms)
export const FILTER_DEBOUNCE_MS = 200;
