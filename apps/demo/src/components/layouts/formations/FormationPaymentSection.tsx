"use client";

import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormationPaymentSectionProps {
  label?: string;
  formData?: Record<string, unknown>;
  children?: ReactNode;
}

export function FormationPaymentSection({ label, formData }: FormationPaymentSectionProps) {
  return (
    <div className={cn("space-y-3 rounded-sm border border-dashed border-border p-5")}>
      <div className="text-sm font-semibold text-foreground">
        {label || "Payment"}
      </div>
      <p className="text-xs text-muted-foreground">
        This is a placeholder for Stripe payment capture. Form data will be logged to the console.
      </p>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          console.log("simulate payment section data", formData);
        }}
      >
        Simulate payment
      </Button>
    </div>
  );
}
