"use client";

import { cn } from "@/lib/utils";
import { countryCodes } from "@/lib/constants";

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
    <div className={cn("space-y-1", width_full ? "w-full" : "w-auto")}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full rounded-sm border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500",
        )}
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
