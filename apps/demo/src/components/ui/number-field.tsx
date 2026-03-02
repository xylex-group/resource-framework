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
        "w-full rounded-sm border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500",
        className,
      )}
      {...rest}
    />
  );
}
