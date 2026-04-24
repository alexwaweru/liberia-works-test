import { useId } from "react";
import { Checkbox as CheckboxPrimitive } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { BaseFieldProps } from "./types";

interface CheckboxProps extends Omit<BaseFieldProps, "placeholder"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function Checkbox({
  label,
  error,
  helperText,
  required,
  disabled,
  id: externalId,
  className,
  checked,
  defaultChecked,
  onCheckedChange,
}: CheckboxProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-2">
        <CheckboxPrimitive
          id={id}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={(val) => onCheckedChange?.(val === true)}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={errorId}
        />
        {label && (
          <Label htmlFor={id} className="cursor-pointer">
            {label}
            {required && (
              <span className="text-destructive ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </Label>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

export { Checkbox };
export type { CheckboxProps };
