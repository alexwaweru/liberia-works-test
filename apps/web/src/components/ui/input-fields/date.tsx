import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FieldWrapper } from "./field-wrapper";
import type { BaseFieldProps, DatePickerMode } from "./types";

interface DatePickerProps extends BaseFieldProps {
  mode?: DatePickerMode;
  numberOfMonths?: 1 | 2;
  value?: Date | Date[] | { from: Date; to?: Date };
  onChange?: (value: Date | Date[] | { from: Date; to?: Date } | undefined) => void;
  placeholder?: string;
  fromDate?: Date;
  toDate?: Date;
}

function DatePicker({
  mode = "single",
  numberOfMonths = 1,
  value,
  onChange,
  placeholder = "Pick a date",
  fromDate,
  toDate,
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const getDisplayText = () => {
    if (!value) return placeholder;

    if (mode === "single" && value instanceof Date) {
      return format(value, "MMM d, yyyy");
    }

    if (mode === "multiple" && Array.isArray(value)) {
      const count = value.length;
      return count > 0 ? `${count} date${count === 1 ? "" : "s"} selected` : placeholder;
    }

    if (mode === "range" && value && typeof value === "object" && "from" in value) {
      const { from, to } = value;
      if (from && to) {
        return `${format(from, "MMM d")} - ${format(to, "MMM d, yyyy")}`;
      }
      if (from) {
        return format(from, "MMM d, yyyy");
      }
    }

    return placeholder;
  };

  function handleSingleSelect(date: Date | undefined) {
    onChange?.(date);
    setOpen(false);
  }

  function handleMultipleSelect(dates: Date[] | undefined) {
    onChange?.(dates);
  }

  function handleRangeSelect(range: DateRange | undefined) {
    onChange?.(range as { from: Date; to?: Date } | undefined);
  }

  return (
    <FieldWrapper
      id={id}
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      className={className}
    >
      {({ id: fieldId, describedBy }) => (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={fieldId}
              variant="outline"
              disabled={disabled}
              aria-describedby={describedBy}
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
              )}
            >
              <CalendarIcon />
              {getDisplayText()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {mode === "single" && (
              <Calendar
                mode="single"
                selected={value instanceof Date ? value : undefined}
                onSelect={handleSingleSelect}
                numberOfMonths={numberOfMonths}
                captionLayout="dropdown"
                fromDate={fromDate ?? new Date(1900, 0, 1)}
                toDate={toDate}
                disabled={disabled}
              />
            )}
            {mode === "multiple" && (
              <Calendar
                mode="multiple"
                selected={Array.isArray(value) ? value : undefined}
                onSelect={handleMultipleSelect}
                numberOfMonths={numberOfMonths}
                captionLayout="dropdown"
                fromDate={fromDate ?? new Date(1900, 0, 1)}
                toDate={toDate}
                disabled={disabled}
              />
            )}
            {mode === "range" && (
              <Calendar
                mode="range"
                selected={
                  value && typeof value === "object" && "from" in value
                    ? (value as DateRange)
                    : undefined
                }
                onSelect={handleRangeSelect}
                numberOfMonths={numberOfMonths}
                captionLayout="dropdown"
                fromDate={fromDate ?? new Date(1900, 0, 1)}
                toDate={toDate}
                disabled={disabled}
              />
            )}
          </PopoverContent>
        </Popover>
      )}
    </FieldWrapper>
  );
}

export { DatePicker };
export type { DatePickerProps };

// ── Native date input ─────────────────────────────────────────────────────────
// Better UX for historical dates (DOB, education years, etc.) — users can type
// directly or use the browser's native year-aware picker instead of scrolling
// month by month through a calendar.

interface DateInputProps extends BaseFieldProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  min?: string
  max?: string
}

function DateInput({
  value,
  onChange,
  min,
  max,
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
}: DateInputProps) {
  const toInputValue = (d?: Date) =>
    d instanceof Date && !isNaN(d.getTime())
      ? d.toISOString().split('T')[0]
      : ''

  return (
    <FieldWrapper
      id={id}
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      className={className}
    >
      {({ id: fieldId, describedBy }) => (
        <input
          id={fieldId}
          type="date"
          value={toInputValue(value)}
          min={min}
          max={max}
          disabled={disabled}
          aria-describedby={describedBy}
          onChange={(e) => {
            const v = e.target.value
            onChange?.(v ? new Date(v + 'T00:00:00') : undefined)
          }}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
            'transition-colors placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
          )}
        />
      )}
    </FieldWrapper>
  )
}

export { DateInput };
export type { DateInputProps };
