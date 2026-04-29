import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { cn } from "../../../../lib/utils";
import { CardItem } from "./card-item";
import { SortableCardItem } from "./sortable-card-item";
import { CARD_DENSITY_CONFIG } from "../constants";
import type { CardViewProps } from "../types";

export function CardView({
  items,
  density,
  selectedIds,
  onSelectionAction,
  onItemOpen,
  contextMenuActions,
  onReorder,
  renderCard,
  className,
}: CardViewProps) {
  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const { gridCols, gap } = CARD_DENSITY_CONFIG[density];
  const isDraggable = !!onReorder;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleSelect = (id: string, shiftKey: boolean, metaKey: boolean) => {
    onSelectionAction({ type: "select", id, shiftKey, metaKey });
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onReorder) return;

      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(items, oldIndex, newIndex);
        onReorder(newOrder.map((item) => item.id));
      }
    },
    [items, onReorder]
  );

  const itemIds = items.map((item) => item.id);
  const CardComponent = isDraggable ? SortableCardItem : CardItem;

  const gridContent = (
    <div
      data-testid="card-view"
      data-slot="card-view"
      role="listbox"
      aria-label="Items grid"
      aria-multiselectable="true"
      className={cn("grid", gridCols, gap, className)}
    >
      {items.length === 0 && <div className="sr-only">No items</div>}
      {items.map((item) => (
        <CardComponent
          key={item.id}
          item={item}
          density={density}
          isSelected={selectedIds.has(item.id)}
          onSelect={handleSelect}
          onItemOpen={onItemOpen}
          contextMenuActions={contextMenuActions}
          selectedItems={selectedItems}
          renderCard={renderCard}
        />
      ))}
    </div>
  );

  if (!isDraggable) return gridContent;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "To pick up a draggable item, press space or enter. Use arrow keys to move. Press space or enter again to drop, or press escape to cancel.",
        },
      }}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        {gridContent}
      </SortableContext>
    </DndContext>
  );
}
