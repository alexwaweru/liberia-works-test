import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FieldWrapper } from "./field-wrapper";
import { cn } from "@/lib/utils";
import type { BaseFieldProps } from "./types";

interface TimePickerProps extends BaseFieldProps {
  value?: string; // "HH:mm" format
  onChange?: (value: string) => void;
  format?: "12h" | "24h"; // default "24h"
  minuteStep?: number; // default 1
  placeholder?: string;
}

function TimePicker({
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
  value,
  onChange,
  format = "24h",
  minuteStep = 1,
  placeholder = "Select time",
}: TimePickerProps) {
  const [open, setOpen] = useState(false);

  // Parse value into hour and minute
  const parseValue = (val?: string): { hour: number; minute: number } | null => {
    if (!val) return null;
    const [h, m] = val.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return { hour: h, minute: m };
  };

  const parsed = parseValue(value);

  // Format time for display
  const formatDisplay = (val?: string): string => {
    if (!val) return placeholder;
    const parsed = parseValue(val);
    if (!parsed) return placeholder;

    if (format === "24h") {
      return `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`;
    } else {
      // 12h format: "h:mm AM/PM"
      const period = parsed.hour >= 12 ? "PM" : "AM";
      const displayHour = parsed.hour % 12 || 12; // Convert 0 to 12, keep 1-11, convert 12-23 to 12,1-11
      return `${displayHour}:${String(parsed.minute).padStart(2, "0")} ${period}`;
    }
  };

  // Generate hour options
  const hours = format === "24h"
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1);

  // Generate minute options based on step
  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, i) => i * minuteStep
  );

  // Track selected hour, minute, period
  const [selectedHour, setSelectedHour] = useState<number | null>(parsed?.hour ?? null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(parsed?.minute ?? null);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(
    parsed && parsed.hour >= 12 ? "PM" : "AM"
  );

  const handleHourSelect = (hour: number) => {
    let actualHour = hour;
    if (format === "12h") {
      // Convert 12h to 24h
      if (selectedPeriod === "PM" && hour !== 12) {
        actualHour = hour + 12;
      } else if (selectedPeriod === "AM" && hour === 12) {
        actualHour = 0;
      }
    }
    setSelectedHour(actualHour);
    emitChange(actualHour, selectedMinute);
  };

  const handleMinuteSelect = (minute: number) => {
    setSelectedMinute(minute);
    emitChange(selectedHour, minute);
  };

  const handlePeriodSelect = (period: "AM" | "PM") => {
    setSelectedPeriod(period);
    if (selectedHour !== null) {
      let actualHour = selectedHour;
      // Adjust hour based on period
      if (format === "12h") {
        const displayHour = selectedHour % 12 || 12;
        if (period === "PM" && displayHour !== 12) {
          actualHour = displayHour + 12;
        } else if (period === "AM" && displayHour === 12) {
          actualHour = 0;
        } else if (period === "AM") {
          actualHour = displayHour;
        } else {
          actualHour = displayHour === 12 ? 12 : displayHour + 12;
        }
      }
      setSelectedHour(actualHour);
      emitChange(actualHour, selectedMinute);
    }
  };

  const emitChange = (hour: number | null, minute: number | null) => {
    if (hour !== null && minute !== null && onChange) {
      const formatted = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      onChange(formatted);
    }
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
      {({ id: fieldId, describedBy }) => (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={fieldId}
              aria-describedby={describedBy}
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <Clock className="mr-2 size-4" />
              {formatDisplay(value)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex w-fit">
              {/* Hours column */}
              <div className="flex flex-col border-r w-14">
                <div className="py-1.5 text-xs font-medium border-b text-muted-foreground text-center">
                  Hr
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {hours.map((hour) => {
                    const actualHour = format === "24h"
                      ? hour
                      : (selectedPeriod === "PM" && hour !== 12 ? hour + 12 : (selectedPeriod === "AM" && hour === 12 ? 0 : hour));
                    const isSelected = selectedHour === actualHour;
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleHourSelect(hour)}
                        className={cn(
                          "w-full py-1.5 text-sm hover:bg-accent text-center transition-colors",
                          isSelected && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        {String(hour).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes column */}
              <div className={cn("flex flex-col w-14", format === "12h" && "border-r")}>
                <div className="py-1.5 text-xs font-medium border-b text-muted-foreground text-center">
                  Min
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {minutes.map((minute) => {
                    const isSelected = selectedMinute === minute;
                    return (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleMinuteSelect(minute)}
                        className={cn(
                          "w-full py-1.5 text-sm hover:bg-accent text-center transition-colors",
                          isSelected && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        {String(minute).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AM/PM column (only for 12h format) */}
              {format === "12h" && (
                <div className="flex flex-col w-14">
                  <div className="py-1.5 text-xs font-medium border-b text-muted-foreground text-center">
                    &nbsp;
                  </div>
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => handlePeriodSelect("AM")}
                      className={cn(
                        "py-1.5 text-sm hover:bg-accent text-center transition-colors",
                        selectedPeriod === "AM" && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePeriodSelect("PM")}
                      className={cn(
                        "py-1.5 text-sm hover:bg-accent text-center transition-colors",
                        selectedPeriod === "PM" && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      PM
                    </button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </FieldWrapper>
  );
}

export { TimePicker };
export type { TimePickerProps };
