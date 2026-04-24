import { useState, useId } from "react";
import { ChevronsUpDown, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BaseFieldProps, CountryData } from "./types";

const DEFAULT_COUNTRIES: CountryData[] = [
  { code: "KE", dialCode: "+254", name: "Kenya", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "UG", dialCode: "+256", name: "Uganda", flag: "\u{1F1FA}\u{1F1EC}" },
  { code: "TZ", dialCode: "+255", name: "Tanzania", flag: "\u{1F1F9}\u{1F1FF}" },
  { code: "RW", dialCode: "+250", name: "Rwanda", flag: "\u{1F1F7}\u{1F1FC}" },
  { code: "BI", dialCode: "+257", name: "Burundi", flag: "\u{1F1E7}\u{1F1EE}" },
  { code: "ET", dialCode: "+251", name: "Ethiopia", flag: "\u{1F1EA}\u{1F1F9}" },
  { code: "NG", dialCode: "+234", name: "Nigeria", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "ZA", dialCode: "+27", name: "South Africa", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "GH", dialCode: "+233", name: "Ghana", flag: "\u{1F1EC}\u{1F1ED}" },
  { code: "US", dialCode: "+1", name: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "IN", dialCode: "+91", name: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "CN", dialCode: "+86", name: "China", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "DE", dialCode: "+49", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "FR", dialCode: "+33", name: "France", flag: "\u{1F1EB}\u{1F1F7}" },
];

interface TelephoneInputProps extends BaseFieldProps {
  value?: string;
  onChange?: (value: string, country: CountryData) => void;
  defaultCountry?: string;
  countries?: CountryData[];
  placeholder?: string;
}

function TelephoneInput({
  label,
  error,
  helperText,
  required,
  disabled,
  id: externalId,
  className,
  value,
  onChange,
  defaultCountry = "KE",
  countries = DEFAULT_COUNTRIES,
  placeholder,
}: TelephoneInputProps) {
  const generatedId = useId();
  const fieldId = externalId ?? generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helperText && !error ? `${fieldId}-helper` : undefined;
  const describedBy =
    [errorId, helperId].filter(Boolean).join(" ") || undefined;

  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(
    () =>
      countries.find((c) => c.code === defaultCountry) ?? countries[0],
  );
  const [search, setSearch] = useState("");

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(e.target.value, selectedCountry);
  }

  function handleCountrySelect(country: CountryData) {
    setSelectedCountry(country);
    setOpen(false);
    setSearch("");
    onChange?.(value ?? "", country);
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
      <div className="flex gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Select country code"
              disabled={disabled}
              className="w-auto shrink-0 gap-1 px-2"
            >
              <span className="text-base leading-none">
                {selectedCountry.flag}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedCountry.dialCode}
              </span>
              <ChevronsUpDown className="size-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 max-w-[calc(100vw-2rem)] p-0" align="start">
            <div className="p-2">
              <Input
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    selectedCountry.code === country.code && "bg-accent",
                  )}
                  onClick={() => handleCountrySelect(country)}
                >
                  <span className="text-base leading-none">
                    {country.flag}
                  </span>
                  <span className="flex-1 text-left truncate">{country.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {country.dialCode}
                  </span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No countries found
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id={fieldId}
            type="tel"
            value={value}
            onChange={handlePhoneChange}
            placeholder={placeholder ?? "Phone number"}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className="pl-9"
          />
        </div>
      </div>
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

export { TelephoneInput, DEFAULT_COUNTRIES };
export type { TelephoneInputProps };
