import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { FormField, FormSection, SectionNavigation, FieldType } from "../types";
import { SectionEditor } from "./section-editor";
import { SortableItem } from "./sortable-item";
import { DragHandle } from "./drag-handle";

export interface SectionListProps {
  sections: FormSection[];
  onMoveSection: (oldIndex: number, newIndex: number) => void;
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
  onUpdateSectionDescription: (sectionId: string, description: string) => void;
  onUpdateSectionNavigation: (sectionId: string, navigation: SectionNavigation) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddField: (sectionId: string, fieldType: FieldType) => void;
  onRemoveField: (sectionId: string, fieldId: string) => void;
  onMoveField: (sectionId: string, oldIndex: number, newIndex: number) => void;
  onUpdateField: (sectionId: string, fieldId: string, updates: Partial<FormField>) => void;
}

export function SectionList({
  sections,
  onMoveSection,
  onUpdateSectionTitle,
  onUpdateSectionDescription,
  onUpdateSectionNavigation,
  onRemoveSection,
  onAddField,
  onRemoveField,
  onMoveField,
  onUpdateField,
}: SectionListProps) {
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
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onMoveSection(oldIndex, newIndex);
      }
    }
  };

  const lockedSections = sections.filter((s) => s.locked);
  const editableSections = sections.filter((s) => !s.locked);

  return (
    <div className="space-y-3">
      {/* Locked sections — rendered outside DnD, no controls */}
      {lockedSections.map((section) => (
        <SectionEditor
          key={section.id}
          section={section}
          allSections={sections}
          locked
          onUpdateTitle={() => {}}
          onUpdateDescription={() => {}}
          onUpdateNavigation={() => {}}
          onAddField={() => {}}
          onRemoveField={() => {}}
          onMoveField={() => {}}
          onUpdateField={() => {}}
          onRemove={() => {}}
        />
      ))}

      {/* Editable sections — managed by DnD */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={editableSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {editableSections.map((section, editableIndex) => (
              <SortableItem key={section.id} id={section.id}>
                {({ setNodeRef, style, listeners, attributes }) => (
                  <div ref={setNodeRef} style={style}>
                    <SectionEditor
                      section={section}
                      allSections={sections}
                      sectionIndex={editableIndex}
                      onUpdateTitle={(title) => onUpdateSectionTitle(section.id, title)}
                      onUpdateDescription={(description) =>
                        onUpdateSectionDescription(section.id, description)
                      }
                      onUpdateNavigation={(navigation) =>
                        onUpdateSectionNavigation(section.id, navigation)
                      }
                      onAddField={(fieldType) => onAddField(section.id, fieldType)}
                      onRemoveField={(fieldId) => onRemoveField(section.id, fieldId)}
                      onMoveField={(oldIndex, newIndex) => onMoveField(section.id, oldIndex, newIndex)}
                      onUpdateField={(fieldId, updates) => onUpdateField(section.id, fieldId, updates)}
                      onRemove={() => onRemoveSection(section.id)}
                      dragHandle={<DragHandle listeners={listeners} attributes={attributes} />}
                    />
                  </div>
                )}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}