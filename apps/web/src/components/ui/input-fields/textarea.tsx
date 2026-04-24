import { Textarea } from "@/components/ui/textarea";
import { FieldWrapper } from "./field-wrapper";
import { cn } from "@/lib/utils";
import type { BaseFieldProps } from "./types";

interface TextareaInputProps
  extends BaseFieldProps,
    Omit<React.ComponentProps<"textarea">, "id"> {
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const resizeClasses = {
  none: "resize-none",
  vertical: "resize-y",
  horizontal: "resize-x",
  both: "resize",
} as const;

function TextareaInput({
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
  resize = "vertical",
  ...textareaProps
}: TextareaInputProps) {
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
        <Textarea
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          disabled={disabled}
          required={required}
          className={cn(resizeClasses[resize])}
          {...textareaProps}
        />
      )}
    </FieldWrapper>
  );
}

export { TextareaInput };
export type { TextareaInputProps };
