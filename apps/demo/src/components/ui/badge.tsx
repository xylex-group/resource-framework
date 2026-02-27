"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "true" | "false" | string;
  size?: "sm" | "md" | string;
  children?: ReactNode;
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantClasses = variant === "true"
    ? "border-sky-500 bg-sky-500/10 text-sky-200"
    : variant === "false"
      ? "border-rose-500 bg-rose-500/10 text-rose-200"
      : "border-slate-700 bg-slate-900 text-slate-200";
  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-[0.55rem]"
    : size === "md"
      ? "px-3 py-0.5 text-xs"
      : "px-2 py-0.5 text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        variantClasses,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
