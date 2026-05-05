import { useState, useCallback } from "react";
import { ChevronUp, Trash2, Settings2, Lock } from "lucide-react";
import type { FormField, FormSection, SectionNavigation, FieldType } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextInput } from "@/components/ui/input-fields/richtext";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { NavigationRuleEditor } from "./navigation-rule-editor";
import { FieldList } from "./field-list";
import { FieldTypePicker } from "./field-type-picker";
import { FIELD_TYPE_REGISTRY } from "../constants";
import { cn } from "@/lib/utils";

export interface SectionEditorProps {
  section: FormSection;
  allSections: FormSection[];
  sectionIndex?: number;
  locked?: boolean;
  readOnly?: boolean;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateNavigation: (navigation: SectionNavigation) => void;
  onAddField: (fieldType: FieldType) => void;
  onRemoveField: (fieldId: string) => void;
  onMoveField: (oldIndex: number, newIndex: number) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onRemove: () => void;
  dragHandle?: React.ReactNode;
}

export function SectionEditor({
  section,
  allSections,
  sectionIndex,
  locked,
  readOnly,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateNavigation,
  onAddField,
  onRemoveField,
  onMoveField,
  onUpdateField,
  onRemove,
  dragHandle,
}: SectionEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const currentSectionFields = section.fields.map((f) => ({ id: f.id, label: f.label }));

  const handleFieldOpen = useCallback(() => {
    setDetailsOpen(false);
  }, []);

  if (locked) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <Lock className="size-3.5 text-muted-foreground" />
            <span className="text-[13px] font-semibold text-foreground">{section.title}</span>
          </div>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
            Pre-filled · Read-only
          </span>
        </div>
        <div className="px-3 py-3 grid grid-cols-2 gap-2">
          {section.fields.map((f) => (
            <div key={f.id} className={f.label === 'Email' ? 'col-span-2' : ''}>
              <p className="text-[11px] font-medium text-muted-foreground mb-1">
                {f.label}
                {f.validation?.required && <span className="text-destructive ml-0.5">*</span>}
              </p>
              <div className="h-8 rounded-md border border-border bg-background/50 px-2.5 flex items-center">
                <span className="text-xs text-muted-foreground/50 select-none">
                  {f.placeholder ?? f.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
          {sectionIndex != null && (
            <span className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
              {sectionIndex + 1}
            </span>
          )}
          <span className="flex-1 text-[13px] font-semibold text-foreground">{section.title}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{section.fields.length}</span>
        </div>
        <div className="px-3 pb-3 pt-2">
          {section.fields.length > 0 ? (
            <div className="space-y-1.5">
              {section.fields.map((f) => {
                const meta = FIELD_TYPE_REGISTRY[f.type]
                const Icon = meta.icon
                return (
                  <div key={f.id} className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-2">
                    <Icon className="size-3.5 text-muted-foreground/60 flex-shrink-0" />
                    <span className="text-[13px] flex-1 truncate">{f.label || meta.label}</span>
                    <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{meta.label}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2 text-center">No questions added</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {dragHandle && <div className="flex-shrink-0">{dragHandle}</div>}

        {/* Section number */}
        {sectionIndex != null && (
          <span className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
            {sectionIndex + 1}
          </span>
        )}

        {/* Inline editable title */}
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="Section title"
          className="flex-1 text-[13px] font-semibold bg-transparent border-none outline-none focus:ring-0 p-0 min-w-0 hover:text-primary focus:text-foreground transition-colors"
        />

        {/* Field count */}
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {section.fields.length}
        </span>

        {/* Settings */}
        <button
          type="button"
          onClick={() => {
            setDetailsOpen(!detailsOpen);
            if (!isOpen) setIsOpen(true);
          }}
          className={cn(
            "size-6 rounded flex items-center justify-center transition-colors shrink-0",
            detailsOpen
              ? "text-primary bg-primary/10"
              : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted"
          )}
          aria-label="Section settings"
        >
          <Settings2 className="size-3.5" />
        </button>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="size-6 rounded flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors shrink-0"
          aria-label={isOpen ? "Collapse section" : "Expand section"}
        >
          <ChevronUp
            className={cn(
              "size-3.5 transition-transform",
              !isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Delete */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground/40 hover:text-destructive"
          aria-label="Remove section"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {/* Section details (title, description, navigation) */}
          {detailsOpen && (
            <div className="rounded-md bg-muted/40 p-3 space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor={`section-title-${section.id}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  Section Title
                </label>
                <Input
                  id={`section-title-${section.id}`}
                  value={section.title}
                  onChange={(e) => onUpdateTitle(e.target.value)}
                  placeholder="Enter section title..."
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Description (optional)
                </span>
                <RichTextInput
                  value={section.description || ""}
                  onChange={(html) => onUpdateDescription(html)}
                  placeholder="Enter section description..."
                  minHeight="100px"
                />
              </div>

              {/* Navigation rules */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground group w-full text-left hover:text-foreground transition-colors">
                  <ChevronUp className="size-3 transition-transform group-data-[state=closed]:rotate-180" />
                  Navigation Rules
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="pt-2">
                    <NavigationRuleEditor
                      navigation={section.navigation}
                      allSections={allSections}
                      currentSectionId={section.id}
                      currentSectionFields={currentSectionFields}
                      onChange={onUpdateNavigation}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Fields */}
          {section.fields.length > 0 ? (
            <FieldList
              fields={section.fields}
              onMoveField={onMoveField}
              onUpdateField={onUpdateField}
              onRemoveField={onRemoveField}
              onFieldOpen={handleFieldOpen}
            />
          ) : (
            <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-md">
              No fields yet. Add one below.
            </p>
          )}

          <FieldTypePicker onSelect={onAddField} />
        </div>
      )}
    </div>
  );
}
