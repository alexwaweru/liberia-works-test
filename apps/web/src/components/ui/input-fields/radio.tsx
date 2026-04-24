import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FieldWrapper } from "./field-wrapper";
import { cn } from "@/lib/utils";
import type { BaseFieldProps, SelectOption } from "./types";

interface RadioInputProps extends BaseFieldProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

function RadioInput({
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
  options,
  value,
  onChange,
  orientation = "vertical",
}: RadioInputProps) {
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
        <RadioGroup
          id={fieldId}
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          className={cn(
            orientation === "horizontal" ? "flex-row" : "flex-col",
          )}
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={option.value}
                id={`${fieldId}-${option.value}`}
                disabled={option.disabled}
              />
              <Label htmlFor={`${fieldId}-${option.value}`}>
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </FieldWrapper>
  );
}

export { RadioInput };
export type { RadioInputProps };
