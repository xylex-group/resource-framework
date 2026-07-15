"use client";

import { Card } from "@/components/ui/card";
import { NumberField } from "@/components/ui/number-field";
import type { ResourceFormField } from "../../../../../../types/resource-forms";

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
    <Card className="space-y-1 p-3">
      <div className="text-xs uppercase text-muted-foreground">
        {field.label}
      </div>
      <NumberField
        value={value ?? 0}
        onValueChange={(v) => onChange(v)}
        className="bg-transparent py-0 text-base font-semibold text-foreground"
      />
    </Card>
  );
}
