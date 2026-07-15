"use client";

import { cn } from "@/lib/utils";
import { countryCodes } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        <Label className="text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </Label>
      )}
      <Select
        value={value || ""}
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
