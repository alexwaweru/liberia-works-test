import { Slider } from "@/components/ui/slider";
import { FieldWrapper } from "./field-wrapper";
import type { BaseFieldProps } from "./types";

interface SliderInputProps extends BaseFieldProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
}

function SliderInput({
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
  value,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
}: SliderInputProps) {
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
        <div className="flex items-center gap-3">
          <Slider
            id={fieldId}
            aria-describedby={describedBy}
            aria-invalid={!!error}
            disabled={disabled}
            value={value !== undefined ? [value] : undefined}
            defaultValue={[defaultValue ?? min]}
            onValueChange={(values) => onChange?.(values[0])}
            min={min}
            max={max}
            step={step}
          />
          {showValue && (
            <span className="text-sm tabular-nums text-muted-foreground min-w-8 text-right">
              {value ?? defaultValue ?? min}
            </span>
          )}
        </div>
      )}
    </FieldWrapper>
  );
}

export { SliderInput };
export type { SliderInputProps };
