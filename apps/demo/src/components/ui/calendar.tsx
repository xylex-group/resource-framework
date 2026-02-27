"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Calendar({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="date"
      className={cn("rounded-sm border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100", className)}
      {...props}
    />
  );
}
