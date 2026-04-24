import { useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldWrapperProps {
  id?: string;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  children: (props: { id: string; labelId: string | undefined; describedBy: string | undefined }) => React.ReactNode;
  className?: string;
}

function FieldWrapper({
  id: externalId,
  label,
  error,
  helperText,
  required,
  disabled,
  children,
  className,
}: FieldWrapperProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const labelId = label ? `${id}-label` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText && !error ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={cn("space-y-2", className)}
      data-disabled={disabled || undefined}
    >
      {label && (
        <Label id={labelId} htmlFor={id}>
          {label}
          {required && (
            <span className="text-destructive ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}
      {children({ id, labelId, describedBy })}
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}

export { FieldWrapper };
export type { FieldWrapperProps };
