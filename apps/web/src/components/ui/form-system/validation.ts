import type { RegisterOptions } from "react-hook-form";
import type { FormField } from "./types";

/**
 * Converts FormField validation rules to React Hook Form RegisterOptions
 * @param field - The form field to convert
 * @returns RegisterOptions for use with react-hook-form register()
 */
export function fieldToRHFRules(field: FormField): RegisterOptions {
  const rules: RegisterOptions = {};
  const v = field.validation;

  if (!v) {
    return rules;
  }

  if (v.required) {
    rules.required = "This field is required";
  }

  if (v.minLength !== undefined) {
    rules.minLength = {
      value: v.minLength,
      message: `Minimum ${v.minLength} characters`,
    };
  }

  if (v.maxLength !== undefined) {
    rules.maxLength = {
      value: v.maxLength,
      message: `Maximum ${v.maxLength} characters`,
    };
  }

  if (v.min !== undefined) {
    rules.min = {
      value: v.min,
      message: `Minimum value is ${v.min}`,
    };
  }

  if (v.max !== undefined) {
    rules.max = {
      value: v.max,
      message: `Maximum value is ${v.max}`,
    };
  }

  if (v.pattern) {
    rules.pattern = {
      value: new RegExp(v.pattern),
      message: v.patternMessage || "Invalid format",
    };
  }

  return rules;
}
