import { Input } from "@/components/ui/input";
import { FieldWrapper } from "./field-wrapper";
import type { BaseFieldProps } from "./types";

interface TextInputProps
  extends BaseFieldProps,
    Omit<React.ComponentProps<"input">, "id" | "type"> {
  type?: "text" | "search";
}

function TextInput({
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
  ...inputProps
}: TextInputProps) {
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
        <Input
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          disabled={disabled}
          required={required}
          {...inputProps}
        />
      )}
    </FieldWrapper>
  );
}

export { TextInput };
export type { TextInputProps };
