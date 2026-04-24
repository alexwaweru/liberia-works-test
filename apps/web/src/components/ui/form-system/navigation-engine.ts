import type {
  NavigationCondition,
  FormSection,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────
// evaluateCondition
// ─────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a single navigation condition against form values.
 *
 * Operators:
 * - equals: strict string equality
 * - not_equals: negation of equals
 * - contains: case-insensitive substring match
 * - greater_than: numeric comparison
 * - less_than: numeric comparison
 * - is_empty: value is undefined, null, or empty string
 * - is_not_empty: negation of is_empty
 *
 * @param condition - The condition to evaluate
 * @param formValues - Current form values
 * @returns true if condition passes, false otherwise
 */
export function evaluateCondition(
  condition: NavigationCondition,
  formValues: Record<string, unknown>
): boolean {
  const fieldValue = formValues[condition.fieldId];
  const { operator, value: conditionValue } = condition;

  switch (operator) {
    case "equals":
      return String(fieldValue) === String(conditionValue);

    case "not_equals":
      return String(fieldValue) !== String(conditionValue);

    case "contains": {
      if (fieldValue === undefined || fieldValue === null) {
        return false;
      }
      const haystack = String(fieldValue).toLowerCase();
      const needle = String(conditionValue).toLowerCase();
      return haystack.includes(needle);
    }

    case "greater_than": {
      const numericFieldValue = Number(fieldValue);
      const numericConditionValue = Number(conditionValue);
      if (isNaN(numericFieldValue) || isNaN(numericConditionValue)) {
        return false;
      }
      return numericFieldValue > numericConditionValue;
    }

    case "less_than": {
      const numericFieldValue = Number(fieldValue);
      const numericConditionValue = Number(conditionValue);
      if (isNaN(numericFieldValue) || isNaN(numericConditionValue)) {
        return false;
      }
      return numericFieldValue < numericConditionValue;
    }

    case "is_empty":
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === ""
      );

    case "is_not_empty":
      return !(
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === ""
      );

    default: {
      const exhaustiveCheck: never = operator;
      throw new Error(`Unknown operator: ${exhaustiveCheck}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// resolveNextSection
// ─────────────────────────────────────────────────────────────────────────

/**
 * Resolves the next section ID based on navigation rules.
 *
 * Evaluates conditional rules in order (first match wins).
 * Each rule's conditions are AND-ed (all must pass).
 * Falls back to defaultNext if no rule matches.
 *
 * @param section - Current section with navigation rules
 * @param formValues - Current form values
 * @returns Next section ID, or null to end form
 */
export function resolveNextSection(
  section: FormSection,
  formValues: Record<string, unknown>
): string | null {
  const { navigation } = section;

  // Evaluate conditional rules in order
  for (const rule of navigation.conditionalRules) {
    const allConditionsPass = rule.conditions.every((condition) =>
      evaluateCondition(condition, formValues)
    );

    if (allConditionsPass) {
      return rule.targetSectionId || null;
    }
  }

  // Fall back to defaultNext
  return navigation.defaultNext;
}

// ─────────────────────────────────────────────────────────────────────────
// detectCircularNavigation
// ─────────────────────────────────────────────────────────────────────────

/**
 * Detects circular navigation in the form using DFS.
 *
 * Only follows defaultNext edges (conditional rules can't be statically analyzed).
 * Returns cycle path if found.
 *
 * @param sections - All form sections
 * @returns Object with hasCircular flag and optional path array
 */
export function detectCircularNavigation(
  sections: FormSection[]
): { hasCircular: boolean; path?: string[] } {
  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(sectionId: string): boolean {
    if (recStack.has(sectionId)) {
      // Found cycle - extract cycle path
      const cycleStartIndex = path.indexOf(sectionId);
      const cyclePath = path.slice(cycleStartIndex);
      cyclePath.push(sectionId); // Complete the cycle
      path.length = 0;
      path.push(...cyclePath);
      return true;
    }

    if (visited.has(sectionId)) {
      return false;
    }

    visited.add(sectionId);
    recStack.add(sectionId);
    path.push(sectionId);

    const section = sectionMap.get(sectionId);
    if (section?.navigation.defaultNext) {
      if (dfs(section.navigation.defaultNext)) {
        return true;
      }
    }

    recStack.delete(sectionId);
    path.pop();
    return false;
  }

  // Start DFS from each unvisited section
  for (const section of sections) {
    if (!visited.has(section.id)) {
      if (dfs(section.id)) {
        return { hasCircular: true, path: [...path] };
      }
    }
  }

  return { hasCircular: false };
}

// ─────────────────────────────────────────────────────────────────────────
// detectUnreachableSections
// ─────────────────────────────────────────────────────────────────────────

/**
 * Detects sections that are unreachable from the first section.
 *
 * Uses BFS following all possible edges (defaultNext + all conditional targets).
 * First section is always the entry point.
 *
 * @param sections - All form sections
 * @returns Array of unreachable section IDs
 */
export function detectUnreachableSections(sections: FormSection[]): string[] {
  if (sections.length === 0) {
    return [];
  }

  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const reachable = new Set<string>();
  const queue: string[] = [sections[0].id];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (reachable.has(currentId)) {
      continue;
    }

    reachable.add(currentId);

    const section = sectionMap.get(currentId);
    if (!section) {
      continue;
    }

    // Follow defaultNext
    if (section.navigation.defaultNext) {
      queue.push(section.navigation.defaultNext);
    }

    // Follow all conditional targets
    for (const rule of section.navigation.conditionalRules) {
      queue.push(rule.targetSectionId);
    }
  }

  // Return sections that aren't reachable
  return sections
    .map((s) => s.id)
    .filter((id) => !reachable.has(id));
}

// ─────────────────────────────────────────────────────────────────────────
// goBack
// ─────────────────────────────────────────────────────────────────────────

/**
 * Navigates back in the history stack.
 *
 * Pops the last entry from history and returns the new current section.
 *
 * @param history - Current navigation history (section IDs)
 * @returns Object with previous section ID and updated history, or null if empty
 */
export function goBack(
  history: string[]
): { previousSectionId: string; newHistory: string[] } | null {
  if (history.length === 0) {
    return null;
  }

  // Clone history and pop last entry
  const newHistory = [...history];
  newHistory.pop();

  // Get the new current section (last in updated history)
  const previousSectionId = newHistory[newHistory.length - 1];

  // Special case: if history had only one item, return that item
  if (history.length === 1) {
    return { previousSectionId: history[0], newHistory: [history[0]] };
  }

  return { previousSectionId, newHistory };
}
