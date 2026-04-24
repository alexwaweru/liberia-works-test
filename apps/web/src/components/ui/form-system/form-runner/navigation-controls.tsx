import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NavigationControlsProps {
  isFirstSection: boolean;
  isLastSection: boolean;
  isSubmitting: boolean;
  disabled?: boolean;
  onBack: () => void;
  onNext: () => Promise<void>;
  onSubmit: () => Promise<void>;
  className?: string;
}

export function NavigationControls({
  isFirstSection,
  isLastSection,
  isSubmitting,
  disabled = false,
  onBack,
  onNext,
  onSubmit,
  className,
}: NavigationControlsProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {/* Back button - hidden on first section */}
      {!isFirstSection && (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={disabled || isSubmitting}
        >
          Back
        </Button>
      )}

      {/* Spacer when back button is hidden */}
      {isFirstSection && <div />}

      {/* Next or Submit button */}
      {isLastSection ? (
        <Button
          type="button"
          variant="default"
          onClick={onSubmit}
          disabled={disabled || isSubmitting}
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          Submit
        </Button>
      ) : (
        <Button
          type="button"
          variant="default"
          onClick={onNext}
          disabled={disabled || isSubmitting}
        >
          Next
        </Button>
      )}
    </div>
  );
}
