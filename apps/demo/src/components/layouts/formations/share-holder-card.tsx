"use client";

import { NumberField } from "@/components/ui/number-field";
import type { ResourceFormField } from "@rf/resource-types";
import { cn } from "@/lib/utils";

export interface ShareHolderCardProps {
  field: ResourceFormField;
  value: number | null;
  onChange: (value: unknown) => void;
  formData?: Record<string, unknown>;
}

export function ShareHolderCard({
  field,
  value,
  onChange,
}: ShareHolderCardProps) {
  return (
    <div className={cn("space-y-1 rounded-sm border border-slate-700 bg-slate-900/40 p-3")}>
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {field.label}
      </div>
      <NumberField
        value={value ?? 0}
        onValueChange={(v) => onChange(v)}
        className="bg-transparent py-0 text-base font-semibold text-white"
      />
    </div>
  );
}
