"use client";

import { cn } from "@/lib/utils";
import { countryCodes } from "@/lib/constants";
import { Label } from "@/components/ui/label";

export interface AddressCountrySelectProps {
  value: string;
  onChange: (newValue: string) => void;
  width_full?: boolean;
  label?: string;
}

export function AddressCountrySelect({
  value,
  onChange,
  width_full,
  label,
}: AddressCountrySelectProps) {
  return (
    <div className={cn("space-y-2", width_full ? "w-full" : "w-auto")}>
      {label && (
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
      )}
      <select
        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select country</option>
        {countryCodes.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
    </div>
  );
}
