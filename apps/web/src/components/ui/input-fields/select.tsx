import { useState, useId } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BaseFieldProps, SelectOption } from "./types";

interface SelectInputProps extends BaseFieldProps {
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
}

function SingleSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  fieldId,
  describedBy,
  error,
}: {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  fieldId: string;
  describedBy?: string;
  error?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange?.(v)}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        id={fieldId}
        className="w-full"
        aria-invalid={!!error}
        aria-describedby={describedBy}
      >
        <SelectValue placeholder={placeholder ?? "Select an option..."} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder,
  disabled,
  fieldId,
  describedBy,
  error,
}: {
  options: SelectOption[];
  value?: string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  fieldId: string;
  describedBy?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = Array.isArray(value) ? value : [];

  function toggleOption(optionValue: string) {
    const next = selected.includes(optionValue)
      ? selected.filter((v) => v !== optionValue)
      : [...selected, optionValue];
    onChange?.(next);
  }

  function removeOption(optionValue: string) {
    onChange?.(selected.filter((v) => v !== optionValue));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={fieldId}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          disabled={disabled}
          className="w-full justify-between font-normal h-auto min-h-9"
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 && (
              <span className="text-muted-foreground">
                {placeholder ?? "Select options..."}
              </span>
            )}
            {selected.map((val) => {
              const opt = options.find((o) => o.value === val);
              return (
                <Badge key={val} variant="secondary" className="gap-1">
                  {opt?.label ?? val}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-0.5 rounded-full outline-none hover:bg-muted-foreground/20 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        removeOption(val);
                      }
                    }}
                    aria-label={`Remove ${opt?.label ?? val}`}
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              );
            })}
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
              option.disabled && "pointer-events-none opacity-50",
            )}
            onClick={() => toggleOption(option.value)}
            disabled={option.disabled}
          >
            <div
              className={cn(
                "flex size-4 items-center justify-center rounded-sm border border-primary",
                selected.includes(option.value)
                  ? "bg-primary text-primary-foreground"
                  : "opacity-50",
              )}
            >
              {selected.includes(option.value) && (
                <Check className="size-3" />
              )}
            </div>
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function SelectInput({
  label,
  error,
  helperText,
  required,
  disabled,
  id: externalId,
  className,
  options,
  value,
  onChange,
  placeholder,
  multiple = false,
}: SelectInputProps) {
  const generatedId = useId();
  const fieldId = externalId ?? generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helperText && !error ? `${fieldId}-helper` : undefined;
  const describedBy =
    [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={fieldId}>
          {label}
          {required && (
            <span className="text-destructive ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}
      {multiple ? (
        <MultiSelect
          options={options}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          fieldId={fieldId}
          describedBy={describedBy}
          error={error}
        />
      ) : (
        <SingleSelect
          options={options}
          value={typeof value === "string" ? value : undefined}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          fieldId={fieldId}
          describedBy={describedBy}
          error={error}
        />
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}

export { SelectInput };
export type { SelectInputProps };
