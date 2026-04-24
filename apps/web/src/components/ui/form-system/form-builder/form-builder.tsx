import { useState } from "react";
import { Eye } from "lucide-react";
import type { FormBuilderProps } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextInput } from "@/components/ui/input-fields/richtext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SectionList } from "./section-list";
import { FormRunner } from "../form-runner/form-runner";
import { useFormBuilder } from "./use-form-builder";
import { cn } from "@/lib/utils";

export function FormBuilder({ definition, onChange, className, showFormMeta = true, previewButtonClassName }: FormBuilderProps & { previewButtonClassName?: string }) {
  const builder = useFormBuilder({ initialDefinition: definition, onChange });
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Header — title, description, preview button */}
        <div className={cn("px-5 border-b bg-muted/30", showFormMeta ? "pt-5 pb-3" : "py-2")}>
          <div className="flex items-center gap-2">
            {showFormMeta && (
              <Input
                value={builder.definition.title}
                onChange={(e) => builder.updateTitle(e.target.value)}
                placeholder="Form title"
                aria-label="Form title"
                className="text-lg font-bold border-none shadow-none bg-transparent px-0 h-auto py-0.5 focus-visible:ring-0"
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className={cn("flex-shrink-0 text-muted-foreground", !showFormMeta && "ml-auto", previewButtonClassName)}
            >
              <Eye className="size-4" aria-hidden="true" />
              Preview
            </Button>
          </div>
          {showFormMeta && (
            <div className="mt-1">
              <RichTextInput
                value={builder.definition.description || ""}
                onChange={(html) => builder.updateDescription(html)}
                placeholder="Form description (optional)"
                minHeight="100px"
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Validation errors */}
          {builder.validationErrors.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-3 space-y-1" role="alert">
              <p className="text-sm font-medium text-destructive">Validation Issues</p>
              <ul className="text-sm text-destructive list-disc pl-5">
                {builder.validationErrors.map((err, i) => (
                  <li key={i}>{err.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sections */}
          <SectionList
            sections={builder.definition.sections}
            onMoveSection={builder.moveSection}
            onUpdateSectionTitle={builder.updateSectionTitle}
            onUpdateSectionDescription={builder.updateSectionDescription}
            onUpdateSectionNavigation={builder.updateSectionNavigation}
            onRemoveSection={builder.removeSection}
            onAddField={builder.addField}
            onRemoveField={(sectionId, fieldId) => builder.removeField(sectionId, fieldId)}
            onMoveField={(sectionId, oldIndex, newIndex) =>
              builder.moveField(sectionId, oldIndex, newIndex)
            }
            onUpdateField={(sectionId, fieldId, updates) =>
              builder.updateField(sectionId, fieldId, updates)
            }
          />

          {/* Add section button */}
          <button
            type="button"
            onClick={builder.addSection}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-muted-foreground/30 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/[0.02] transition-colors"
          >
            + Add section
          </button>
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
            <DialogDescription>
              This is how the form will appear to respondents
            </DialogDescription>
          </DialogHeader>
          {previewOpen && (
            <FormRunner
              key={JSON.stringify(builder.definition)}
              definition={builder.definition}
              onSubmit={() => setPreviewOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
