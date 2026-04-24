import type { FormDefinition, BuilderValidationError } from "../types";
import { detectCircularNavigation, detectUnreachableSections } from "../navigation-engine";

/**
 * Validates a FormDefinition and returns array of validation errors
 * Checks for:
 * - Empty sections (no fields)
 * - Missing field labels (non-display-only fields)
 * - Circular navigation paths
 * - Unreachable sections
 *
 * @param definition - The form definition to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateFormDefinition(definition: FormDefinition): BuilderValidationError[] {
  const errors: BuilderValidationError[] = [];

  // Check for duplicate field IDs across all sections
  const seenFieldIds = new Set<string>();
  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (seenFieldIds.has(field.id)) {
        errors.push({
          type: "duplicate_field_id",
          sectionId: section.id,
          fieldId: field.id,
          message: `Duplicate field ID "${field.id}" in section "${section.title}"`,
        });
      } else {
        seenFieldIds.add(field.id);
      }
    }
  }

  // Check each section for issues
  for (const section of definition.sections) {
    if (section.locked) continue;

    // Check for empty sections
    if (section.fields.length === 0) {
      errors.push({
        type: "empty_section",
        sectionId: section.id,
        message: `Section "${section.title}" has no fields`,
      });
    }

    // Check for missing field labels (skip display-only fields)
    for (const field of section.fields) {
      const hasLabel = field.label && field.label.trim().length > 0;

      if (!hasLabel) {
        errors.push({
          type: "missing_field_label",
          sectionId: section.id,
          fieldId: field.id,
          message: `Field ${field.id} is missing a label`,
        });
      }
    }
  }

  // Check for circular navigation
  const circularResult = detectCircularNavigation(definition.sections);
  if (circularResult.hasCircular && circularResult.path) {
    const pathString = circularResult.path.join(" → ");
    errors.push({
      type: "circular_navigation",
      message: `Circular navigation detected: ${pathString}`,
    });
  }

  // Check for unreachable sections
  const unreachableSections = detectUnreachableSections(definition.sections);
  for (const sectionId of unreachableSections) {
    errors.push({
      type: "unreachable_section",
      sectionId,
      message: `Section "${sectionId}" is unreachable`,
    });
  }

  return errors;
}
