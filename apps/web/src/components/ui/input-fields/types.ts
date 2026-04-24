export interface BaseFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface CountryData {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
}

export type DatePickerMode = "single" | "multiple" | "range";
