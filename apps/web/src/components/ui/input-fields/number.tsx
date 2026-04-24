import { ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldWrapper } from "./field-wrapper";
import type { BaseFieldProps } from "./types";

interface NumberInputProps extends BaseFieldProps {
  value?: number | "";
  defaultValue?: number;
  placeholder?: string;
  onChange?: (value: number | undefined) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  min?: number;
  max?: number;
  step?: number;
  showStepper?: boolean;
}

function clampValue(
  val: number,
  min?: number,
  max?: number,
): number {
  let result = val;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  return result;
}

function NumberInput({
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
  value,
  defaultValue,
  placeholder,
  onChange,
  onBlur,
  min,
  max,
  step = 1,
  showStepper = false,
}: NumberInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onChange?.(undefined);
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      onChange?.(num);
    }
  }

  function handleStep(direction: 1 | -1) {
    const current = typeof value === "number" ? value : (defaultValue ?? 0);
    const next = clampValue(current + step * direction, min, max);
    onChange?.(next);
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
        <div className="relative">
          <Input
            id={fieldId}
            type="number"
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            disabled={disabled}
            required={required}
            value={value ?? ""}
            defaultValue={defaultValue}
            placeholder={placeholder}
            onChange={handleChange}
            onBlur={onBlur}
            min={min}
            max={max}
            step={step}
            className={showStepper ? "pr-9" : undefined}
          />
          {showStepper && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="h-5 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => handleStep(1)}
                disabled={
                  disabled ||
                  (max !== undefined && typeof value === "number" && value >= max)
                }
                aria-label="Increment"
                tabIndex={-1}
              >
                <ChevronUp className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="h-5 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => handleStep(-1)}
                disabled={
                  disabled ||
                  (min !== undefined && typeof value === "number" && value <= min)
                }
                aria-label="Decrement"
                tabIndex={-1}
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </FieldWrapper>
  );
}

export { NumberInput };
export type { NumberInputProps };
