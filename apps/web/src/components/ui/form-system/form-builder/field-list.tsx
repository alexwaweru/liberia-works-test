import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useState, useCallback } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import type { FormField } from "../types";
import { SortableItem } from "./sortable-item";
import { DragHandle } from "./drag-handle";
import { FieldEditor } from "./field-editor";

export interface FieldListProps {
  fields: FormField[];
  onMoveField: (oldIndex: number, newIndex: number) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onRemoveField: (fieldId: string) => void;
  /** Called when any field editor is expanded */
  onFieldOpen?: () => void;
}

function FieldList({
  fields,
  onMoveField,
  onUpdateField,
  onRemoveField,
  onFieldOpen,
}: FieldListProps) {
  // Accordion: only one field open at a time
  const [openFieldId, setOpenFieldId] = useState<string | null>(null);

  const handleFieldOpenChange = useCallback(
    (fieldId: string, open: boolean) => {
      setOpenFieldId(open ? fieldId : null);
      if (open) {
        onFieldOpen?.();
      }
    },
    [onFieldOpen]
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onMoveField(oldIndex, newIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {fields.map((field) => (
            <SortableItem key={field.id} id={field.id}>
              {({ setNodeRef, style, listeners, attributes }) => (
                <div ref={setNodeRef} style={style}>
                  <FieldEditor
                    field={field}
                    onUpdate={(updates) => onUpdateField(field.id, updates)}
                    onRemove={() => onRemoveField(field.id)}
                    isOpen={openFieldId === field.id}
                    onOpenChange={(open) => handleFieldOpenChange(field.id, open)}
                    dragHandle={<DragHandle listeners={listeners} attributes={attributes} />}
                  />
                </div>
              )}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export { FieldList };
