"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn("rounded-sm border border-slate-700 bg-slate-900", className)}
      {...props}
    />
  );
}
