import {
  TextInput,
  TextareaInput,
  NumberInput,
  EmailInput,
  DatePicker,
  TimePicker,
  DateTimePicker,
  SelectInput,
  RadioInput,
  Checkbox,
  Rating,
  RichTextInput,
  URLInput,
} from "@/components/ui/input-fields";
import type { FormField } from "./types";

export interface InputRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

export function InputRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
}: InputRendererProps) {
  const baseProps = {
    id: field.id,
    label: field.label,
    error,
    helperText: field.helperText,
    required: field.validation?.required,
    disabled: disabled ?? field.disabled,
  };

  switch (field.type) {
    case "text":
      return (
        <TextInput
          {...baseProps}
          placeholder={field.placeholder}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "textarea":
      return (
        <TextareaInput
          {...baseProps}
          placeholder={field.placeholder}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <NumberInput
          {...baseProps}
          placeholder={field.placeholder}
          min={field.validation?.min}
          max={field.validation?.max}
          value={value as number | undefined}
          onChange={onChange}
        />
      );

    case "email":
      return (
        <EmailInput
          {...baseProps}
          placeholder={field.placeholder}
          validateOnBlur={false}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "date":
      return (
        <DatePicker
          {...baseProps}
          mode="single"
          value={value as Date | undefined}
          onChange={onChange}
        />
      );

    case "url":
      return (
        <URLInput
          {...baseProps}
          placeholder={field.placeholder}
          validateOnBlur={false}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "time":
      return (
        <TimePicker
          {...baseProps}
          value={value as string}
          onChange={onChange}
        />
      );

    case "datetime":
      return (
        <DateTimePicker
          {...baseProps}
          value={value as string}
          onChange={onChange}
        />
      );

    case "select":
      return (
        <SelectInput
          {...baseProps}
          placeholder={field.placeholder}
          multiple={false}
          options={field.options ?? []}
          value={value as string}
          onChange={(val) => onChange(val)}
        />
      );



    case "multiselect":
      return (
        <SelectInput
          {...baseProps}
          placeholder={field.placeholder}
          multiple={true}
          options={field.options ?? []}
          value={value as string[]}
          onChange={(val) => onChange(val)}
        />
      );

    case "radio":
      return (
        <RadioInput
          {...baseProps}
          options={field.options ?? []}
          value={value as string}
          onChange={onChange}
        />
      );

    case "checkbox":
      return (
        <Checkbox
          {...baseProps}
          checked={value as boolean}
          onCheckedChange={(checked) => onChange(checked)}
        />
      );

    case "rating":
      return (
        <Rating
          {...baseProps}
          maxStars={field.ratingConfig?.maxStars}
          value={value as number}
          onChange={onChange}
        />
      );

    case "rich_text":
      return (
        <RichTextInput
          {...baseProps}
          placeholder={field.placeholder}
          value={value as string}
          onChange={onChange}
        />
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          Unsupported field type: {field.type}
        </div>
      );
  }
}
