import type { LucideIcon } from "lucide-react";
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Calendar,
  Clock,
  CalendarClock,
  Link,
  List,
  ListChecks,
  CircleDot,
  CheckSquare,
  Star,
  FileText,
  Phone,
  KeyRound,
  ToggleLeft,
  SlidersHorizontal,
  Search,
} from "lucide-react";

import type { FieldType, FormField } from "./types";

export interface FieldTypeMeta {
  type: FieldType;
  label: string;
  icon: LucideIcon;
  category: "input" | "choice" | "media" | "display";
  hasOptions: boolean;
  isDisplayOnly: boolean;
  defaultField: Partial<FormField>;
}

export const FIELD_TYPE_REGISTRY: Record<FieldType, FieldTypeMeta> = {
  text: {
    type: "text",
    label: "Text",
    icon: Type,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Text Field", placeholder: "Enter text..." },
  },
  textarea: {
    type: "textarea",
    label: "Long Text",
    icon: AlignLeft,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Long Text", placeholder: "Enter text..." },
  },
  number: {
    type: "number",
    label: "Number",
    icon: Hash,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Number", placeholder: "0" },
  },
  email: {
    type: "email",
    label: "Email",
    icon: Mail,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Email", placeholder: "name@example.com" },
  },
  date: {
    type: "date",
    label: "Date",
    icon: Calendar,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Date" },
  },
  time: {
    type: "time",
    label: "Time",
    icon: Clock,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Time" },
  },
  datetime: {
    type: "datetime",
    label: "Date & Time",
    icon: CalendarClock,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Date & Time" },
  },
  select: {
    type: "select",
    label: "Dropdown",
    icon: List,
    category: "choice",
    hasOptions: true,
    isDisplayOnly: false,
    defaultField: {
      label: "Dropdown",
      placeholder: "Select an option...",
      options: [
        { label: "Option 1", value: "option_1" },
        { label: "Option 2", value: "option_2" },
      ],
    },
  },
  multiselect: {
    type: "multiselect",
    label: "Multi-Select",
    icon: ListChecks,
    category: "choice",
    hasOptions: true,
    isDisplayOnly: false,
    defaultField: {
      label: "Multi-Select",
      placeholder: "Select options...",
      options: [
        { label: "Option 1", value: "option_1" },
        { label: "Option 2", value: "option_2" },
      ],
    },
  },
  radio: {
    type: "radio",
    label: "Radio",
    icon: CircleDot,
    category: "choice",
    hasOptions: true,
    isDisplayOnly: false,
    defaultField: {
      label: "Radio Selection",
      options: [
        { label: "Option 1", value: "option_1" },
        { label: "Option 2", value: "option_2" },
      ],
    },
  },
  checkbox: {
    type: "checkbox",
    label: "Checkbox",
    icon: CheckSquare,
    category: "choice",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Checkbox" },
  },
  rating: {
    type: "rating",
    label: "Rating",
    icon: Star,
    category: "choice",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Rating", ratingConfig: { maxStars: 5 } },
  },
  rich_text: {
    type: "rich_text",
    label: "Rich Text",
    icon: FileText,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Rich Text", placeholder: "Write something..." },
  },
  url: {
    type: "url",
    label: "URL",
    icon: Link,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "URL", placeholder: "https://example.com" },
  },
  telephone: {
    type: "telephone",
    label: "Phone",
    icon: Phone,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Phone", placeholder: "+1 555 000 0000" },
  },
  password: {
    type: "password",
    label: "Password",
    icon: KeyRound,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Password" },
  },
  switch: {
    type: "switch",
    label: "Switch",
    icon: ToggleLeft,
    category: "choice",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Toggle" },
  },
  slider: {
    type: "slider",
    label: "Slider",
    icon: SlidersHorizontal,
    category: "input",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Slider" },
  },
  query_select: {
    type: "query_select",
    label: "Query Select",
    icon: Search,
    category: "choice",
    hasOptions: false,
    isDisplayOnly: false,
    defaultField: { label: "Query Select", placeholder: "Search..." },
  },
};

export const FIELD_CATEGORIES = [
  { key: "input" as const, label: "Input" },
  { key: "choice" as const, label: "Choice" },
  { key: "media" as const, label: "Media" },
  { key: "display" as const, label: "Display" },
];

export const COMPARISON_OPERATORS: {
  value: import("./types").ComparisonOperator;
  label: string;
}[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "is_empty", label: "Is empty" },
  { value: "is_not_empty", label: "Is not empty" },
];
