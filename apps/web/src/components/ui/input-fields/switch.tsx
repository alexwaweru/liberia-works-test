import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { BaseFieldProps } from "./types";

interface SwitchInputProps extends Omit<BaseFieldProps, "placeholder"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function SwitchInput({
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
}: SwitchInputProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-2">
        <Switch
          id={id}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
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

export { SwitchInput };
export type { SwitchInputProps };
