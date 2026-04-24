import { useState } from "react";
import { Plus, X } from "lucide-react";
import { FIELD_TYPE_REGISTRY, FIELD_CATEGORIES } from "../constants";
import type { FieldType } from "../types";
import { cn } from "@/lib/utils";

export interface FieldTypePickerProps {
  onSelect: (fieldType: FieldType) => void;
  disabled?: boolean;
}

function FieldTypePicker({ onSelect, disabled }: FieldTypePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (type: FieldType) => {
    onSelect(type);
    setOpen(false);
  };

  // Group registry entries by category
  const grouped = FIELD_CATEGORIES.map((cat) => ({
    ...cat,
    fields: Object.values(FIELD_TYPE_REGISTRY).filter((m) => m.category === cat.key),
  }));

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/[0.04] hover:border-primary/50 transition-colors disabled:opacity-50"
      >
        <Plus size={13} />
        Add question
      </button>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-2.5 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Choose field type
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close field picker"
        >
          <X size={12} />
        </button>
      </div>

      {/* Categories as compact grids */}
      {grouped.map((group) => (
        <div key={group.key}>
          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">
            {group.label}
          </p>
          <div className="grid grid-cols-3 gap-1">
            {group.fields.map((meta) => {
              const Icon = meta.icon;
              return (
                <button
                  key={meta.type}
                  type="button"
                  onClick={() => handleSelect(meta.type)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left",
                    "text-xs text-foreground bg-background border border-transparent",
                    "hover:border-primary/30 hover:bg-primary/[0.04] transition-colors"
                  )}
                >
                  <Icon className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export { FieldTypePicker };
