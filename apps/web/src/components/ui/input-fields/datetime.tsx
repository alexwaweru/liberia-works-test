import { format, parse } from "date-fns";
import { FieldWrapper } from "./field-wrapper";
import { DatePicker } from "./date";
import { TimePicker } from "./time";
import type { BaseFieldProps } from "./types";

interface DateTimePickerProps extends BaseFieldProps {
  value?: string; // ISO 8601 datetime string e.g. "2024-01-15T14:30"
  onChange?: (value: string) => void; // emits ISO string
}

function DateTimePicker({
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
  value,
  onChange,
}: DateTimePickerProps) {
  // Parse ISO string into date and time parts
  const parseValue = (
    val?: string,
  ): { date: Date | undefined; time: string | undefined } => {
    if (!val) return { date: undefined, time: undefined };

    const [datePart, timePart] = val.split("T");
    if (!datePart) return { date: undefined, time: undefined };

    // Parse date part to Date object
    const date = parse(datePart, "yyyy-MM-dd", new Date());
    const time = timePart || undefined;

    return { date: isNaN(date.getTime()) ? undefined : date, time };
  };

  const { date, time } = parseValue(value);

  const handleDateChange = (newDate: Date | Date[] | { from: Date; to?: Date } | undefined) => {
    // Only handle single date mode
    if (newDate instanceof Date && !isNaN(newDate.getTime())) {
      const datePart = format(newDate, "yyyy-MM-dd");
      const timePart = time || "00:00";
      const combined = `${datePart}T${timePart}`;
      onChange?.(combined);
    } else if (newDate === undefined && onChange) {
      // Date cleared - clear entire value
      onChange("");
    }
  };

  const handleTimeChange = (newTime: string) => {
    if (!date) {
      // Time set but no date - don't emit yet
      return;
    }
    const datePart = format(date, "yyyy-MM-dd");
    const combined = `${datePart}T${newTime}`;
    onChange?.(combined);
  };

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
      {() => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DatePicker
            mode="single"
            value={date}
            onChange={handleDateChange}
            disabled={disabled}
          />
          <TimePicker
            value={time}
            onChange={handleTimeChange}
            disabled={disabled}
          />
        </div>
      )}
    </FieldWrapper>
  );
}

export { DateTimePicker };
export type { DateTimePickerProps };
