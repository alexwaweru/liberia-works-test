import { useState, useCallback, useRef, useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type {
  FormDefinition,
  FormField,
  FormSection,
  SectionNavigation,
  BuilderValidationError,
  FieldType,
} from "../types";
import { FIELD_TYPE_REGISTRY } from "../constants";
import { validateFormDefinition } from "./builder-validation";

export interface UseFormBuilderOptions {
  initialDefinition?: FormDefinition;
  onChange: (definition: FormDefinition) => void;
}

export interface UseFormBuilderReturn {
  definition: FormDefinition;
  validationErrors: BuilderValidationError[];

  // Form-level
  updateTitle: (title: string) => void;
  updateDescription: (description: string) => void;

  // Section mutations
  addSection: () => void;
  removeSection: (sectionId: string) => void;
  moveSection: (oldIndex: number, newIndex: number) => void;
  updateSectionTitle: (sectionId: string, title: string) => void;
  updateSectionDescription: (sectionId: string, description: string) => void;
  updateSectionNavigation: (
    sectionId: string,
    navigation: SectionNavigation
  ) => void;

  // Field mutations
  addField: (sectionId: string, fieldType: FieldType) => void;
  removeField: (sectionId: string, fieldId: string) => void;
  moveField: (sectionId: string, oldIndex: number, newIndex: number) => void;
  updateField: (
    sectionId: string,
    fieldId: string,
    updates: Partial<FormField>
  ) => void;
}

function createDefaultDefinition(): FormDefinition {
  const formId = crypto.randomUUID();
  const sectionId = crypto.randomUUID();

  return {
    id: formId,
    title: "Untitled Form",
    description: "",
    sections: [
      {
        id: sectionId,
        title: "Section 1",
        description: "",
        fields: [],
        navigation: {
          defaultNext: null,
          conditionalRules: [],
        },
      },
    ],
    version: 1,
  };
}

export function useFormBuilder({
  initialDefinition,
  onChange,
}: UseFormBuilderOptions): UseFormBuilderReturn {
  const [definition, setDefinition] = useState<FormDefinition>(
    initialDefinition ?? createDefaultDefinition()
  );
  const [validationErrors, setValidationErrors] = useState<
    BuilderValidationError[]
  >(() => validateFormDefinition(initialDefinition ?? createDefaultDefinition()));
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger debounced onChange and re-validate
  const scheduleOnChange = useCallback(
    (newDefinition: FormDefinition) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Validate immediately
      const errors = validateFormDefinition(newDefinition);
      setValidationErrors(errors);

      // Debounce onChange callback
      debounceTimerRef.current = setTimeout(() => {
        onChange(newDefinition);
      }, 200);
    },
    [onChange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const updateTitle = useCallback(
    (title: string) => {
      const newDefinition = { ...definition, title };
      setDefinition(newDefinition);
      scheduleOnChange(newDefinition);
    },
    [definition, scheduleOnChange]
  );

  const updateDescription = useCallback(
    (description: string) => {
      const newDefinition = { ...definition, description };
      setDefinition(newDefinition);
      scheduleOnChange(newDefinition);
    },
    [definition, scheduleOnChange]
  );

  const addSection = useCallback(() => {
    const newSectionId = crypto.randomUUID();
    const newSectionNumber = definition.sections.filter((s) => !s.locked).length + 1;

    const newSection: FormSection = {
      id: newSectionId,
      title: `Section ${newSectionNumber}`,
      description: "",
      fields: [],
      navigation: {
        defaultNext: null,
        conditionalRules: [],
      },
    };

    // Update previous last section's defaultNext to point to new section
    const updatedSections = [...definition.sections];
    if (updatedSections.length > 0) {
      const lastSectionIndex = updatedSections.length - 1;
      updatedSections[lastSectionIndex] = {
        ...updatedSections[lastSectionIndex],
        navigation: {
          ...updatedSections[lastSectionIndex].navigation,
          defaultNext: newSectionId,
        },
      };
    }

    updatedSections.push(newSection);

    const newDefinition = { ...definition, sections: updatedSections };
    setDefinition(newDefinition);
    scheduleOnChange(newDefinition);
  }, [definition, scheduleOnChange]);

  const removeSection = useCallback(
    (sectionId: string) => {
      if (definition.sections.find((s) => s.id === sectionId)?.locked) return;

      const updatedSections = definition.sections.filter(
        (s) => s.id !== sectionId
      );

      // Update navigation references that pointed to removed section
      const fixedSections = updatedSections.map((section) => {
        if (section.navigation.defaultNext === sectionId) {
          return {
            ...section,
            navigation: {
              ...section.navigation,
              defaultNext: null,
            },
          };
        }
        return section;
      });

      const newDefinition = { ...definition, sections: fixedSections };
      setDefinition(newDefinition);
      scheduleOnChange(newDefinition);
    },
    [definition, scheduleOnChange]
  );

  const moveSection = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (definition.sections[oldIndex]?.locked || definition.sections[newIndex]?.locked) return;
      const updatedSections = arrayMove(definition.sections, oldIndex, newIndex);
      const newDefinition = { ...definition, sections: updatedSections };
      setDefinition(newDefinition);
      scheduleOnChange(newDefinition);
    },
    [definition, scheduleOnChange]
  );

  const updateSectionTitle = useCallback(
    (sectionId: string, title: string) => {
      const updatedSections = definition.sections.map((section) =>
        section.id === sectionId ? { ...section, title } : section
      );
      const newDefinition = { ...definition, sections: updatedSections };
      setDefinition(newDefinition);
      scheduleOnChange(newDefinition);
    },
    [definition, scheduleOnChange]
  );

  const updateSectionDescription = useCallback(
    (sectionId: string, description: string) => {
      const updatedSections = definition.sections.map((section) =>
        section.id === sectionId ? { ...section, description } : section
      );
      const newDefinition = { ...definition, sections: updatedSections };
      setDefinition(newDefinition);
      scheduleOnChange(newDefinition);
    },
    [definition, scheduleOnChange]
  );

  const updateSectionNavigation = useCallback(
    (sectionId: string, navigation: SectionNavigation) => {
      const updatedSections = definition.sections.map((section) =>
        section.id === sectionId ? { ...section, navigation } : section
      );
      const newDefinition = { ...definition, sections: updatedSections };
      setDefinition(newDefinition);
      scheduleOnChange(newDefinition);
    },
    [definition, scheduleOnChange]
  );

  const addField = useCallback(
    (sectionId: string, fieldType: FieldType) => {
      const fieldId = crypto.randomUUID();
      const defaultFieldProps = FIELD_TYPE_REGISTRY[fieldType].defaultField;

      const newField: FormField = {
        id: fieldId,
        type: fieldType,
        ...defaultFieldProps,
      } as FormField;

      const updatedSections = definition.sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            fields: [...section.fields, newField],
          };
        }
        return section;
      });

      const newDefinition = { ...definition, sections: updatedSections };
      setDefinition(newDefinition);
      scheduleOnChange(newDefinition);
    },
    [definition, scheduleOnChange]
  );

  const removeField = useCallback(
    (sectionId: string, fieldId: string) => {
      const updatedSections = definition.sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            fields: section.fields.filter((f) => f.id !== fieldId),
          };
        }
        return section;
      });

      const newDefinition = { ...definition, sections: updatedSections };
      setDefinition(newDefinition);
      scheduleOnChange(newDefinition);
    },
    [definition, scheduleOnChange]
  );

  const moveField = useCallback(
    (sectionId: string, oldIndex: number, newIndex: number) => {
      const updatedSections = definition.sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            fields: arrayMove(section.fields, oldIndex, newIndex),
          };
        }
        return section;
      });

      const newDefinition = { ...definition, sections: updatedSections };
      setDefinition(newDefinition);
      scheduleOnChange(newDefinition);
    },
    [definition, scheduleOnChange]
  );

  const updateField = useCallback(
    (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
      const updatedSections = definition.sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            fields: section.fields.map((field) =>
              field.id === fieldId ? { ...field, ...updates } : field
            ),
          };
        }
        return section;
      });

      const newDefinition = { ...definition, sections: updatedSections };
      setDefinition(newDefinition);
      scheduleOnChange(newDefinition);
    },
    [definition, scheduleOnChange]
  );

  return {
    definition,
    validationErrors,
    updateTitle,
    updateDescription,
    addSection,
    removeSection,
    moveSection,
    updateSectionTitle,
    updateSectionDescription,
    updateSectionNavigation,
    addField,
    removeField,
    moveField,
    updateField,
  };
}
