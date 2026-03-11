"use client";

import { NumberField } from "@/components/ui/number-field";
import type { ResourceFormField } from "../../../../../../types/resource-forms";
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
    <div className={cn("space-y-1 rounded-sm border border-border bg-card p-3")}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {field.label}
      </div>
      <NumberField
        value={value ?? 0}
        onValueChange={(v) => onChange(v)}
        className="bg-transparent py-0 text-base font-semibold text-foreground"
      />
    </div>
  );
}
