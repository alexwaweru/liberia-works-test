import { useState, useMemo, useCallback } from "react";
import { useForm, useWatch, type Control, type FieldErrors } from "react-hook-form";
import type { FormDefinition, FormSection } from "../types";
import { resolveNextSection, goBack } from "../navigation-engine";

export interface UseFormRunnerOptions {
  definition: FormDefinition;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onSectionChange?: (sectionId: string, index: number) => void;
}

export interface UseFormRunnerReturn {
  // RHF integration
  control: Control<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;

  // Navigation
  currentSection: FormSection;
  currentSectionIndex: number;
  totalSections: number;
  visitedSections: Set<string>;
  isFirstSection: boolean;
  isLastSection: boolean;

  // Actions
  handleNext: () => Promise<void>;
  handleBack: () => void;
  handleSubmit: () => Promise<void>;

  // State
  isSubmitting: boolean;
}

export function useFormRunner(
  options: UseFormRunnerOptions
): UseFormRunnerReturn {
  const { definition, initialValues = {}, onSubmit, onSectionChange } = options;

  // Initialize react-hook-form
  const {
    control,
    trigger,
    getValues,
    handleSubmit: rhfHandleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, unknown>>({
    defaultValues: initialValues,
    mode: "onBlur",
  });

  // Navigation state
  const [currentSectionId, setCurrentSectionId] = useState<string>(
    definition.sections[0]?.id || ""
  );
  const [history, setHistory] = useState<string[]>([
    definition.sections[0]?.id || "",
  ]);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(
    new Set([definition.sections[0]?.id || ""])
  );

  // Derived state
  const currentSection = useMemo(
    () =>
      definition.sections.find((s) => s.id === currentSectionId) ||
      definition.sections[0],
    [definition.sections, currentSectionId]
  );

  const currentSectionIndex = useMemo(
    () => definition.sections.findIndex((s) => s.id === currentSectionId),
    [definition.sections, currentSectionId]
  );

  const totalSections = definition.sections.length;

  const isFirstSection = currentSectionIndex === 0;

  // Get field IDs for current section (excluding display-only fields)
  const currentSectionFieldIds = useMemo(
    () => currentSection.fields.map((field) => field.id),
    [currentSection]
  );

  // Extract field IDs used in navigation conditions for the current section
  const navigationFieldIds = useMemo(
    () =>
      currentSection.navigation.conditionalRules.flatMap((rule) =>
        rule.conditions.map((c) => c.fieldId)
      ),
    [currentSection]
  );

  // Subscribe to navigation-relevant fields so changes trigger a re-render
  const watchedValues = useWatch({ control, name: navigationFieldIds });

  // Compute isLastSection reactively — watchedValues ensures this re-runs on field change
  const isLastSection = useMemo(
    () => resolveNextSection(currentSection, getValues()) === null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentSection, getValues, watchedValues]
  );

  // Navigate to next section
  const handleNext = useCallback(async () => {
    // Validate current section fields only
    const isValid = await trigger(currentSectionFieldIds);

    if (!isValid) {
      return;
    }

    const formValues = getValues();
    const nextSectionId = resolveNextSection(currentSection, formValues);

    if (nextSectionId === null) {
      return;
    }

    // Find next section index
    const nextSectionIndex = definition.sections.findIndex(
      (s) => s.id === nextSectionId
    );

    if (nextSectionIndex === -1) {
      console.warn(`Next section "${nextSectionId}" not found`);
      return;
    }

    // Update navigation state
    setHistory((prev) => [...prev, nextSectionId]);
    setVisitedSections((prev) => new Set([...prev, nextSectionId]));
    setCurrentSectionId(nextSectionId);

    // Call callback
    if (onSectionChange) {
      onSectionChange(nextSectionId, nextSectionIndex);
    }
  }, [
    trigger,
    currentSectionFieldIds,
    getValues,
    currentSection,
    definition.sections,
    onSectionChange,
  ]);

  // Navigate back
  const handleBack = useCallback(() => {
    const result = goBack(history);

    if (!result) {
      return;
    }

    const { previousSectionId, newHistory } = result;

    // Find previous section index
    const prevSectionIndex = definition.sections.findIndex(
      (s) => s.id === previousSectionId
    );

    if (prevSectionIndex === -1) {
      console.warn(`Previous section "${previousSectionId}" not found`);
      return;
    }

    setHistory(newHistory);
    setCurrentSectionId(previousSectionId);

    if (onSectionChange) {
      onSectionChange(previousSectionId, prevSectionIndex);
    }
  }, [history, definition.sections, onSectionChange]);

  // Submit form
  const handleSubmit = useCallback(async () => {
    // First validate current section
    const isValid = await trigger(currentSectionFieldIds);

    if (!isValid) {
      return;
    }

    // Then submit the form (RHF will validate all fields)
    await rhfHandleSubmit((values) => {
      // Filter values to only include visited section fields
      const visitedFieldIds = new Set<string>();

      definition.sections.forEach((section) => {
        if (visitedSections.has(section.id)) {
            section.fields.forEach((field) => visitedFieldIds.add(field.id));
        }
      });

      const filteredValues: Record<string, unknown> = {};
      for (const fieldId of visitedFieldIds) {
        if (fieldId in values) {
          filteredValues[fieldId] = values[fieldId];
        }
      }

      return onSubmit(filteredValues);
    })();
  }, [
    trigger,
    currentSectionFieldIds,
    rhfHandleSubmit,
    definition.sections,
    visitedSections,
    onSubmit,
  ]);

  return {
    control,
    errors,
    currentSection,
    currentSectionIndex,
    totalSections,
    visitedSections,
    isFirstSection,
    isLastSection,
    handleNext,
    handleBack,
    handleSubmit,
    isSubmitting,
  };
}
