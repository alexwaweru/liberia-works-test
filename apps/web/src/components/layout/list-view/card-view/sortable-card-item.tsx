import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardItem } from "./card-item";
import type { CardItemProps } from "../types";

export function SortableCardItem(props: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="presentation"
      aria-roledescription="sortable item"
      aria-label={`Draggable: ${props.item.name}`}
    >
      <CardItem {...props} renderCard={props.renderCard} />
    </div>
  );
}
