"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number;
  onValueChange: (value: number) => void;
  label?: string;
}

export function NumberField({
  value,
  onValueChange,
  className,
  label: _label,
  ...rest
}: NumberFieldProps) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : ""}
      onChange={(event) => {
        const next = event.target.value;
        const parsed = next === "" ? NaN : Number(next);
        onValueChange(Number.isFinite(parsed) ? parsed : 0);
      }}
      className={cn(
        "h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
        className,
      )}
      {...rest}
    />
  );
}
