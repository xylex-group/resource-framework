"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
  size?: "sm" | "icon" | "default";
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...rest
}: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-sm px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const variantClasses = variant === "ghost"
    ? "bg-transparent text-slate-200 hover:bg-slate-800/50 focus-visible:ring-slate-500"
    : "bg-slate-800 text-white hover:bg-slate-700 focus-visible:ring-slate-500";
  const sizeClasses = size === "sm"
    ? "text-xs px-2 py-1"
    : size === "icon"
      ? "p-1"
      : "";
  return (
    <button className={cn(base, variantClasses, sizeClasses, className)} {...rest} />
  );
}
