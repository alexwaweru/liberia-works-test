import { GripVertical } from "lucide-react";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";

export interface DragHandleProps {
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
}

export function DragHandle({ listeners, attributes }: DragHandleProps) {
  return (
    <button
      type="button"
      className="flex items-center justify-center size-5 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none"
      aria-label="Drag to reorder"
      {...listeners}
      {...attributes}
    >
      <GripVertical className="size-3.5" />
    </button>
  );
}
