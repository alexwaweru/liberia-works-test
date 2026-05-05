// ─── Field Types ───
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "date"
  | "time"
  | "datetime"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "rating"
  | "rich_text"
  | "url"
  | "telephone"
  | "password"
  | "switch"
  | "slider"
  | "query_select";


// ─── Comparison Operators ───
export type ComparisonOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty";

// ─── Field Validation ───
export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

// ─── Field Option (select, radio, likert) ───
export interface FieldOption {
  label: string;
  value: string;
}

// ─── Type-specific Configs ───
export interface RatingConfig {
  maxStars: number;
}

// ─── Form Field ───
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  helperText?: string;
  placeholder?: string;
  validation?: FieldValidation;
  disabled?: boolean;
  options?: FieldOption[];
  ratingConfig?: RatingConfig;
  content?: string;
  imageUrl?: string;
  imageAlt?: string;
}

// ─── Navigation ───
export interface NavigationCondition {
  fieldId: string;
  operator: ComparisonOperator;
  value: string | number | boolean;
}

export interface ConditionalNavigation {
  conditions: NavigationCondition[];
  targetSectionId: string;
}

export interface SectionNavigation {
  defaultNext: string | null;
  conditionalRules: ConditionalNavigation[];
}

// ─── Form Section ───
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  navigation: SectionNavigation;
  locked?: boolean;
}

// ─── Form Definition (the JSON contract) ───
export interface FormDefinition {
  id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  version: number;
}

// ─── Component Props ───
export interface FormRunnerProps {
  definition: FormDefinition;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onSectionChange?: (sectionId: string, index: number) => void;
  disabled?: boolean;
  className?: string;
}

export interface FormBuilderProps {
  definition?: FormDefinition;
  onChange: (definition: FormDefinition) => void;
  className?: string;
  showFormMeta?: boolean;
  readOnly?: boolean;
}

// ─── Navigation State ───
export interface NavigationState {
  currentSectionId: string;
  history: string[];
  visitedSections: Set<string>;
}

// ─── Builder Validation ───
export interface BuilderValidationError {
  type:
    | "circular_navigation"
    | "unreachable_section"
    | "missing_field_label"
    | "empty_section"
    | "duplicate_field_id";
  sectionId?: string;
  fieldId?: string;
  message: string;
}
