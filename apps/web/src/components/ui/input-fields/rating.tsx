import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldWrapper } from "./field-wrapper";
import type { BaseFieldProps } from "./types";

interface RatingProps extends BaseFieldProps {
  value?: number;
  onChange?: (value: number) => void;
  maxStars?: number;
}

function Rating({
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
  value = 0,
  onChange,
  maxStars = 5,
}: RatingProps) {
  function handleStarClick(starValue: number) {
    if (disabled) return;
    // Toggle: if clicking current value, clear to 0
    const newValue = value === starValue ? 0 : starValue;
    onChange?.(newValue);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

    const currentValue = value || 0;
    let newValue = currentValue;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        newValue = Math.min(currentValue + 1, maxStars);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        newValue = Math.max(currentValue - 1, 0);
        break;
      case "Home":
        e.preventDefault();
        newValue = 1;
        break;
      case "End":
        e.preventDefault();
        newValue = maxStars;
        break;
      default:
        return;
    }

    if (newValue !== currentValue) {
      onChange?.(newValue);
    }
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
      {({ describedBy }) => (
        <div
          role="radiogroup"
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          className="flex gap-1"
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? undefined : 0}
        >
          {Array.from({ length: maxStars }, (_, index) => {
            const starValue = index + 1;
            const isFilled = starValue <= value;

            return (
              <Button
                key={starValue}
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 hover:bg-transparent"
                onClick={() => handleStarClick(starValue)}
                disabled={disabled}
                aria-label={`Rate ${starValue} out of ${maxStars} stars`}
                tabIndex={-1}
              >
                <Star
                  className={
                    isFilled
                      ? "size-5 fill-current text-brand-gold"
                      : "size-5 text-muted-foreground"
                  }
                />
              </Button>
            );
          })}
        </div>
      )}
    </FieldWrapper>
  );
}

export { Rating };
export type { RatingProps };
