import { Controller, type Control, type FieldErrors } from "react-hook-form";
import type { FormSection } from "../types";
import { fieldToRHFRules } from "../validation";
import { InputRenderer } from "../input-render";

export interface SectionRendererProps {
  section: FormSection;
  control: Control<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;
  disabled?: boolean;
}

export function SectionRenderer({
  section,
  control,
  disabled,
}: SectionRendererProps) {
  const isDisabled = disabled;
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
        {section.description && (
          <div
            className="text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: section.description }}
          />
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {section.fields.map((field) => {
          // Value-producing fields render with Controller
          return (
            <Controller
              key={field.id}
              name={field.id}
              control={control}
              rules={fieldToRHFRules(field)}
              render={({ field: rhfField, fieldState }) => (
                <InputRenderer
                  field={field}
                  value={rhfField.value}
                  onChange={rhfField.onChange}
                  error={fieldState.error?.message}
                  disabled={isDisabled}
                />
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
