"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function RadioGroup({ className, children }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {children}
    </div>
  );
}

export function RadioGroupItem({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "rounded px-3 py-1 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function RadioGroupButton({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLButtonElement>) {
  return (
    <RadioGroupItem className={cn("bg-slate-800", className)} {...props}>
      {children}
    </RadioGroupItem>
  );
}
