import { useState, useRef, useId, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, X, Search, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BaseFieldProps, SelectOption } from "./types";

interface QuerySelectProps extends BaseFieldProps {
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  onSearch: (query: string) => Promise<SelectOption[]>;
  multiple?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
  placeholder?: string;
}

function QuerySelect({
  label,
  error,
  helperText,
  required,
  disabled,
  id: externalId,
  className,
  value,
  onChange,
  onSearch,
  multiple = false,
  debounceMs = 300,
  minQueryLength = 1,
  placeholder,
}: QuerySelectProps) {
  const generatedId = useId();
  const fieldId = externalId ?? generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helperText && !error ? `${fieldId}-helper` : undefined;
  const describedBy =
    [errorId, helperId].filter(Boolean).join(" ") || undefined;

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [labelCache, setLabelCache] = useState<Map<string, string>>(new Map());

  const debounceTimerRef = useRef<number | undefined>(undefined);
  const searchCounterRef = useRef(0);

  const selected = multiple
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === "string"
      ? value
      : undefined;

  // Build label map from results + cache
  const labelMap = useMemo(() => {
    const map = new Map(labelCache);
    results.forEach((opt) => {
      map.set(opt.value, opt.label);
    });
    return map;
  }, [results, labelCache]);

  // Debounced search
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (searchQuery.length < minQueryLength) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (debounceTimerRef.current !== undefined) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsLoading(true);
    searchCounterRef.current += 1;
    const currentSearch = searchCounterRef.current;

    debounceTimerRef.current = window.setTimeout(() => {
      onSearch(searchQuery)
        .then((opts) => {
          if (currentSearch === searchCounterRef.current) {
            setResults(opts);
            setIsLoading(false);
            // Update cache with new labels
            setLabelCache((prev) => {
              const next = new Map(prev);
              opts.forEach((opt) => {
                next.set(opt.value, opt.label);
              });
              return next;
            });
          }
        })
        .catch(() => {
          if (currentSearch === searchCounterRef.current) {
            setResults([]);
            setIsLoading(false);
          }
        });
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current !== undefined) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, onSearch, debounceMs, minQueryLength]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSelect(optionValue: string, optionLabel: string) {
    // Update cache immediately
    setLabelCache((prev) => new Map(prev).set(optionValue, optionLabel));

    if (multiple) {
      const current = Array.isArray(selected) ? selected : [];
      const next = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];
      onChange?.(next);
    } else {
      onChange?.(optionValue);
      setOpen(false);
    }
  }

  function handleRemove(optionValue: string) {
    if (multiple) {
      const current = Array.isArray(selected) ? selected : [];
      const next = current.filter((v) => v !== optionValue);
      onChange?.(next);
    }
  }

  function isSelected(optionValue: string): boolean {
    if (multiple) {
      return Array.isArray(selected) && selected.includes(optionValue);
    }
    return selected === optionValue;
  }

  function renderTriggerContent() {
    if (multiple) {
      const selectedArray = Array.isArray(selected) ? selected : [];
      if (selectedArray.length === 0) {
        return (
          <span className="text-muted-foreground">
            {placeholder ?? "Select options..."}
          </span>
        );
      }
      return (
        <div className="flex flex-wrap gap-1">
          {selectedArray.map((val) => {
            const optLabel = labelMap.get(val) ?? val;
            return (
              <Badge key={val} variant="secondary" className="gap-1">
                {optLabel}
                <span
                  role="button"
                  tabIndex={0}
                  className="ml-0.5 rounded-full outline-none hover:bg-muted-foreground/20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      handleRemove(val);
                    }
                  }}
                  aria-label={`Remove ${optLabel}`}
                >
                  <X className="size-3" />
                </span>
              </Badge>
            );
          })}
        </div>
      );
    } else {
      if (!selected) {
        return (
          <span className="text-muted-foreground">
            {placeholder ?? "Select an option..."}
          </span>
        );
      }
      return <span>{labelMap.get(selected as string) ?? selected}</span>;
    }
  }

  function renderPopoverContent() {
    if (searchQuery.length < minQueryLength) {
      return (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Type to search...
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="py-6 text-center flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin" role="status" />
          <span className="text-sm text-muted-foreground">Searching...</span>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No results found
        </div>
      );
    }

    return (
      <div className="max-h-64 overflow-y-auto">
        {results.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
              option.disabled && "pointer-events-none opacity-50",
            )}
            onClick={() => handleSelect(option.value, option.label)}
            disabled={option.disabled}
          >
            <div
              className={cn(
                "flex size-4 items-center justify-center",
                isSelected(option.value) && "text-primary",
              )}
            >
              {isSelected(option.value) && <Check className="size-4" />}
            </div>
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={fieldId}>
          {label}
          {required && (
            <span className="text-destructive ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={fieldId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            disabled={disabled}
            className="w-full justify-between font-normal h-auto min-h-9 bg-transparent"
          >
            {renderTriggerContent()}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 size-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          {renderPopoverContent()}
        </PopoverContent>
      </Popover>
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}

export { QuerySelect };
export type { QuerySelectProps };
