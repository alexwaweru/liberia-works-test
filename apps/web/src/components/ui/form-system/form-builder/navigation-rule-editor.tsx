import { Plus, Trash2, X } from "lucide-react";
import type { SectionNavigation, FormSection, NavigationCondition } from "../types";
import { COMPARISON_OPERATORS } from "../constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface NavigationRuleEditorProps {
  navigation: SectionNavigation;
  allSections: FormSection[];
  currentSectionId: string;
  currentSectionFields: Array<{ id: string; label: string }>;
  onChange: (navigation: SectionNavigation) => void;
}

const SUBMIT_SENTINEL = "__submit__";

export function NavigationRuleEditor({
  navigation,
  allSections,
  currentSectionId,
  currentSectionFields,
  onChange,
}: NavigationRuleEditorProps) {
  const availableSections = allSections.filter((s) => s.id !== currentSectionId);

  const handleDefaultNextChange = (value: string) => {
    onChange({
      ...navigation,
      defaultNext: value === SUBMIT_SENTINEL ? null : value,
    });
  };

  const handleAddRule = () => {
    onChange({
      ...navigation,
      conditionalRules: [
        ...navigation.conditionalRules,
        {
          targetSectionId: availableSections[0]?.id || "",
          conditions: [
            {
              fieldId: currentSectionFields[0]?.id || "",
              operator: "equals",
              value: "",
            },
          ],
        },
      ],
    });
  };

  const handleRemoveRule = (index: number) => {
    onChange({
      ...navigation,
      conditionalRules: navigation.conditionalRules.filter((_, i) => i !== index),
    });
  };

  const handleUpdateRuleTarget = (index: number, targetSectionId: string) => {
    const updated = [...navigation.conditionalRules];
    updated[index] = {
      ...updated[index],
      targetSectionId: targetSectionId === SUBMIT_SENTINEL ? "" : targetSectionId,
    };
    onChange({ ...navigation, conditionalRules: updated });
  };

  const handleAddCondition = (ruleIndex: number) => {
    const updated = [...navigation.conditionalRules];
    updated[ruleIndex] = {
      ...updated[ruleIndex],
      conditions: [
        ...updated[ruleIndex].conditions,
        {
          fieldId: currentSectionFields[0]?.id || "",
          operator: "equals",
          value: "",
        },
      ],
    };
    onChange({ ...navigation, conditionalRules: updated });
  };

  const handleRemoveCondition = (ruleIndex: number, conditionIndex: number) => {
    const updated = [...navigation.conditionalRules];
    updated[ruleIndex] = {
      ...updated[ruleIndex],
      conditions: updated[ruleIndex].conditions.filter((_, i) => i !== conditionIndex),
    };
    onChange({ ...navigation, conditionalRules: updated });
  };

  const handleUpdateCondition = (
    ruleIndex: number,
    conditionIndex: number,
    updates: Partial<NavigationCondition>
  ) => {
    const updated = [...navigation.conditionalRules];
    updated[ruleIndex] = {
      ...updated[ruleIndex],
      conditions: updated[ruleIndex].conditions.map((c, i) =>
        i === conditionIndex ? { ...c, ...updates } : c
      ),
    };
    onChange({ ...navigation, conditionalRules: updated });
  };

  return (
    <div className="space-y-4">
      {/* Default next section */}
      <div className="space-y-2">
        <Label htmlFor="default-next">Default Next Section</Label>
        <Select value={navigation.defaultNext || SUBMIT_SENTINEL} onValueChange={handleDefaultNextChange}>
          <SelectTrigger id="default-next" className="w-full">
            <SelectValue placeholder="Select next section..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SUBMIT_SENTINEL}>End form (submit)</SelectItem>
            {availableSections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conditional rules */}
      {navigation.conditionalRules.length > 0 && (
        <div className="space-y-3">
          <Label>Conditional Rules</Label>
          {navigation.conditionalRules.map((rule, ruleIndex) => (
            <div
              key={ruleIndex}
              className="border rounded-md p-4 space-y-3 bg-muted/20"
            >
              {/* Target section */}
              <div className="flex items-center gap-2">
                <Label className="flex-shrink-0 text-xs">Navigate to:</Label>
                <Select
                  value={rule.targetSectionId || SUBMIT_SENTINEL}
                  onValueChange={(value) => handleUpdateRuleTarget(ruleIndex, value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select section..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SUBMIT_SENTINEL}>End form (submit)</SelectItem>
                    {availableSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRule(ruleIndex)}
                  aria-label="Remove rule"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Conditions (AND logic) */}
              <div className="space-y-2 pl-4 border-l-2">
                <Label className="text-xs text-muted-foreground">
                  When all conditions are true:
                </Label>
                {rule.conditions.map((condition, conditionIndex) => (
                  <div key={conditionIndex} className="flex items-center gap-2">
                    {/* Field select */}
                    <Select
                      value={condition.fieldId}
                      onValueChange={(value) =>
                        handleUpdateCondition(ruleIndex, conditionIndex, { fieldId: value })
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {currentSectionFields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Operator select */}
                    <Select
                      value={condition.operator}
                      onValueChange={(value) =>
                        handleUpdateCondition(ruleIndex, conditionIndex, {
                          operator: value as NavigationCondition["operator"],
                        })
                      }
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPARISON_OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Value input (hidden for is_empty/is_not_empty) */}
                    {condition.operator !== "is_empty" &&
                      condition.operator !== "is_not_empty" && (
                        <Input
                          type="text"
                          value={String(condition.value)}
                          onChange={(e) =>
                            handleUpdateCondition(ruleIndex, conditionIndex, {
                              value: e.target.value,
                            })
                          }
                          placeholder="Value..."
                          aria-label="Condition value"
                          className="flex-1"
                        />
                      )}

                    {/* Remove condition button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCondition(ruleIndex, conditionIndex)}
                      aria-label="Remove condition"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}

                {/* Add condition button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddCondition(ruleIndex)}
                  className="w-full text-primary"
                >
                  <Plus className="size-4" /> Add condition
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add conditional rule button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddRule}
        className="w-full text-primary mb-2"
        disabled={currentSectionFields.length === 0}
      >
        <Plus className="size-4" /> Add conditional rule
      </Button>
    </div>
  );
}
