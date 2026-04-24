import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldWrapper } from "./field-wrapper";
import type { BaseFieldProps } from "./types";

interface PasswordInputProps
  extends BaseFieldProps,
    Omit<React.ComponentProps<"input">, "id" | "type"> {
  showToggle?: boolean;
}

function PasswordInput({
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
  showToggle = true,
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

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
            type={visible ? "text" : "password"}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            disabled={disabled}
            required={required}
            className={showToggle ? "pr-10" : undefined}
            {...inputProps}
          />
          {showToggle && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setVisible((v) => !v)}
              disabled={disabled}
              aria-label={visible ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {visible ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          )}
        </div>
      )}
    </FieldWrapper>
  );
}

export { PasswordInput };
export type { PasswordInputProps };
