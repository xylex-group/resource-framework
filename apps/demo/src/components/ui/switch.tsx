"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative">
        <input
          type="checkbox"
          className="sr-only"
          {...props}
        />
        <span className="block h-5 w-10 rounded-full bg-slate-700 transition"></span>
        <span className="absolute left-0 top-0 h-5 w-5 rounded-full bg-white shadow transition-transform data-[checked=true]:translate-x-5" />
      </span>
      {props["aria-label"] && (
        <span className="text-sm text-slate-200">{props["aria-label"]}</span>
      )}
    </label>
  );
}
