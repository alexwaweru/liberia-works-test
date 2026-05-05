import { useState } from "react";
import { Trash2, ChevronDown, X, Plus } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FIELD_TYPE_REGISTRY } from "../constants";
import type { FormField } from "../types";

export interface FieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
  /** Controlled open state (managed by parent for accordion behavior) */
  isOpen?: boolean;
  /** Called when the open state should change */
  onOpenChange?: (open: boolean) => void;
  dragHandle?: React.ReactNode;
  readOnly?: boolean;
}

function FieldEditor({ field, onUpdate, onRemove, isOpen: controlledOpen, onOpenChange, dragHandle, readOnly }: FieldEditorProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isOpen = controlledOpen ?? internalOpen;

  const handleOpenChange = (open: boolean) => {
    onOpenChange?.(open);
    setInternalOpen(open);
  };
  const meta = FIELD_TYPE_REGISTRY[field.type];
  const Icon = meta.icon;
  const isRequired = field.validation?.required;

  // Determine if placeholder should be shown
  const shouldShowPlaceholder = field.type !== "checkbox" && field.type !== "rating"

  if (readOnly) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-2">
        <Icon className="size-4 text-muted-foreground/60 flex-shrink-0" />
        <span className="text-[13px] font-medium flex-1 truncate">{field.label || meta.label}</span>
        <span className="text-[11px] text-muted-foreground">{meta.label}</span>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <div
        className={cn(
          "border rounded-md transition-colors",
          isOpen ? "bg-card border-primary/20" : "bg-card hover:bg-muted/40"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 px-2.5 py-2">
          {dragHandle && <div className="flex-shrink-0">{dragHandle}</div>}

          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 min-w-0 flex-1 text-left"
              aria-label={field.label || meta.label}
            >
              <Icon className="size-4 text-muted-foreground/60 flex-shrink-0" aria-hidden="true" />
              <span className="text-[13px] font-medium flex-1 truncate">
                {field.label || meta.label}
              </span>
              {isRequired && (
                <span className="text-xs text-primary font-bold shrink-0">*</span>
              )}
            </button>
          </CollapsibleTrigger>

          <span className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
            {meta.label}
          </span>

          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="size-5 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground shrink-0"
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={cn(
                  "size-3 transition-transform",
                  isOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>
          </CollapsibleTrigger>

          <button
            type="button"
            onClick={onRemove}
            className="size-5 flex items-center justify-center text-muted-foreground/30 hover:text-destructive transition-colors shrink-0"
            aria-label="Remove field"
          >
            <Trash2 className="size-3" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <CollapsibleContent>
          <div className="border-t p-3 space-y-3">
            {/* Label */}
            <div className="space-y-1">
              <Label htmlFor={`${field.id}-label`} className="text-xs">Field Label</Label>
              <Input
                id={`${field.id}-label`}
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Enter field label"
                className="h-8 text-sm"
              />
            </div>

            {/* Placeholder */}
            {shouldShowPlaceholder && (
              <div className="space-y-1">
                <Label htmlFor={`${field.id}-placeholder`} className="text-xs">Placeholder</Label>
                <Input
                  id={`${field.id}-placeholder`}
                  value={field.placeholder || ""}
                  onChange={(e) => onUpdate({ placeholder: e.target.value })}
                  placeholder="Enter placeholder text"
                  className="h-8 text-sm"
                />
              </div>
            )}

            {/* Helper Text */}
            <div className="space-y-1">
              <Label htmlFor={`${field.id}-helper`} className="text-xs">Helper Text</Label>
              <Input
                id={`${field.id}-helper`}
                value={field.helperText || ""}
                onChange={(e) => onUpdate({ helperText: e.target.value })}
                placeholder="Optional help text"
                className="h-8 text-sm"
              />
            </div>

            {/* Required + Disabled */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id={`${field.id}-required`}
                    checked={field.validation?.required || false}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          required: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor={`${field.id}-required`} className="text-xs">Required</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id={`${field.id}-disabled`}
                    checked={field.disabled || false}
                    onCheckedChange={(checked) =>
                      onUpdate({ disabled: checked === true })
                    }
                  />
                  <Label htmlFor={`${field.id}-disabled`} className="text-xs">Disabled</Label>
                </div>
            </div>

            {/* Options Editor */}
            {meta.hasOptions && field.options && (
              <div className="space-y-2">
                <Label className="text-xs">Options</Label>
                {field.options.map((opt, i) => (
                  <div key={i} className="flex gap-1.5 items-center">
                    <Input
                      value={opt.label}
                      onChange={(e) => {
                        const newOptions = [...field.options!];
                        newOptions[i] = { ...opt, label: e.target.value };
                        onUpdate({ options: newOptions });
                      }}
                      placeholder="Label"
                      aria-label={`Option ${i + 1} label`}
                      className="flex-1 h-8 text-sm"
                    />
                    <Input
                      value={opt.value}
                      onChange={(e) => {
                        const newOptions = [...field.options!];
                        newOptions[i] = { ...opt, value: e.target.value };
                        onUpdate({ options: newOptions });
                      }}
                      placeholder="Value"
                      aria-label={`Option ${i + 1} value`}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        const newOptions = field.options!.filter((_, j) => j !== i);
                        onUpdate({ options: newOptions });
                      }}
                      aria-label="Remove option"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const newOptions = [...field.options!, { label: "", value: "" }];
                    onUpdate({ options: newOptions });
                  }}
                >
                  <Plus className="size-3.5" /> Add Option
                </Button>
              </div>
            )}

            {/* Max Stars (rating) */}
            {field.type === "rating" && (
              <div className="space-y-1">
                <Label htmlFor={`${field.id}-maxStars`} className="text-xs">Max Stars</Label>
                <Input
                  id={`${field.id}-maxStars`}
                  type="number"
                  min={1}
                  max={10}
                  value={field.ratingConfig?.maxStars || 5}
                  onChange={(e) =>
                    onUpdate({
                      ratingConfig: {
                        maxStars: parseInt(e.target.value) || 5,
                      },
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
            )}

          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export { FieldEditor };
