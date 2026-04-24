import { useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FieldWrapper } from "./field-wrapper";
import type { BaseFieldProps } from "./types";

interface EmailInputProps
  extends BaseFieldProps,
    Omit<React.ComponentProps<"input">, "id" | "type"> {
  validateOnBlur?: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EmailInput({
  label,
  error: externalError,
  helperText,
  required,
  disabled,
  id,
  className,
  validateOnBlur = true,
  onBlur,
  ...inputProps
}: EmailInputProps) {
  const [internalError, setInternalError] = useState<string>();
  const error = externalError ?? internalError;

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (validateOnBlur && e.target.value && !EMAIL_PATTERN.test(e.target.value)) {
      setInternalError("Please enter a valid email address");
    } else {
      setInternalError(undefined);
    }
    onBlur?.(e);
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
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id={fieldId}
            type="email"
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            disabled={disabled}
            required={required}
            onBlur={handleBlur}
            className="pl-9"
            {...inputProps}
          />
        </div>
      )}
    </FieldWrapper>
  );
}

export { EmailInput };
export type { EmailInputProps };
