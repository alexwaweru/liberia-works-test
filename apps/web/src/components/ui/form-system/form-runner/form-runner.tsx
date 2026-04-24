import { useFormRunner } from "./use-form-runner";
import { ProgressBar } from "./progress-bar";
import { NavigationControls } from "./navigation-controls";
import { SectionRenderer } from "./section-renderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FormRunnerProps } from "../types";
import { cn } from "@/lib/utils";

export function FormRunner({
  definition,
  initialValues,
  onSubmit,
  onSectionChange,
  disabled = false,
  className,
}: FormRunnerProps) {
  const {
    control,
    errors,
    currentSection,
    visitedSections,
    isFirstSection,
    isLastSection,
    handleNext,
    handleBack,
    handleSubmit,
    isSubmitting,
  } = useFormRunner({
    definition,
    initialValues,
    onSubmit,
    onSectionChange,
  });

  // Prepare sections for progress bar
  const progressSections = definition.sections.map((s) => ({
    id: s.id,
    title: s.title,
  }));

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <CardTitle>{definition.title}</CardTitle>
          {definition.description && (
            <CardDescription
              dangerouslySetInnerHTML={{ __html: definition.description }}
            />
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Progress indicator */}
          <ProgressBar
            sections={progressSections}
            currentSectionId={currentSection.id}
            visitedSections={visitedSections}
          />

          {/* Current section */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="space-y-8"
          >
            <SectionRenderer
              section={currentSection}
              control={control}
              errors={errors}
              disabled={disabled || isSubmitting}
            />

            {/* Navigation controls */}
            <NavigationControls
              isFirstSection={isFirstSection}
              isLastSection={isLastSection}
              isSubmitting={isSubmitting}
              disabled={disabled}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={handleSubmit}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
