import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  sections: Array<{ id: string; title: string }>;
  currentSectionId: string;
  visitedSections: Set<string>;
  className?: string;
}

export function ProgressBar({
  sections,
  currentSectionId,
  visitedSections,
  className,
}: ProgressBarProps) {
  const currentIndex = sections.findIndex((s) => s.id === currentSectionId);

  return (
    <nav aria-label="Form progress" className={cn("w-full", className)}>
      {/* Desktop: show all steps */}
      <ol
        role="list"
        className="hidden md:flex items-start"
      >
        {sections.map((section, index) => {
          const isCurrent = section.id === currentSectionId;
          const isVisited = visitedSections.has(section.id);
          const isCompleted = isVisited && !isCurrent;

          return (
            <li
              key={section.id}
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              className="flex flex-col items-center text-center flex-1"
            >
              <div className="flex items-center w-full">
                {/* Left connector (invisible on first item) */}
                <div
                  className={cn(
                    "h-px flex-1 transition-colors",
                    index === 0
                      ? "bg-transparent"
                      : isVisited || isCompleted
                        ? "bg-primary/30"
                        : "bg-border"
                  )}
                  aria-hidden="true"
                />

                {/* Step circle */}
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full transition-colors flex-shrink-0",
                    "size-7 text-xs font-medium",
                    {
                      "bg-primary text-primary-foreground": isCurrent,
                      "bg-primary/20 text-primary": isCompleted,
                      "bg-muted text-muted-foreground": !isVisited,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check
                      className="size-3.5"
                      data-testid="check-icon"
                      aria-hidden="true"
                    />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Right connector (invisible on last item) */}
                <div
                  className={cn(
                    "h-px flex-1 transition-colors",
                    index === sections.length - 1
                      ? "bg-transparent"
                      : isCompleted
                        ? "bg-primary/30"
                        : "bg-border"
                  )}
                  aria-hidden="true"
                />
              </div>

              {/* Title below circle */}
              <span
                className={cn(
                  "text-xs mt-1 max-w-[100px] truncate",
                  {
                    "font-medium text-foreground": isCurrent,
                    "text-muted-foreground": !isCurrent,
                  }
                )}
                title={section.title}
              >
                {section.title}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile: show current step only */}
      <div
        className="md:hidden flex items-center justify-center gap-2 text-sm text-muted-foreground"
        aria-live="polite"
      >
        <span className="font-medium text-foreground">
          Step {currentIndex + 1} of {sections.length}
        </span>
        {sections[currentIndex] && (
          <>
            <span aria-hidden="true">·</span>
            <span>{sections[currentIndex].title}</span>
          </>
        )}
      </div>
    </nav>
  );
}
