"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "brand" | "icon_v2" | "icon_v3";
  size?: "default" | "sm" | "icon" | "icon_v2" | "icon_v3";
  icon?: ReactNode;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  icon,
  children,
  ...rest
}: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const variantClasses =
    variant === "ghost"
      ? "bg-transparent text-slate-200 hover:bg-slate-800/50 focus-visible:ring-slate-500"
      : variant === "outline"
        ? "bg-transparent border border-slate-700 text-slate-200 hover:border-slate-500 focus-visible:ring-slate-500"
        : variant === "brand"
          ? "bg-sky-600 text-white hover:bg-sky-500 focus-visible:ring-sky-500"
          : variant === "icon_v2"
            ? "bg-slate-900 border border-slate-700 text-slate-200 shadow-inner hover:border-slate-500 focus-visible:ring-slate-500"
            : variant === "icon_v3"
              ? "bg-white/5 text-white hover:bg-white/20 focus-visible:ring-white"
              : "bg-slate-800 text-white hover:bg-slate-700 focus-visible:ring-slate-500";
  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-1"
      : size === "icon"
        ? "h-10 w-10 p-0 text-xs uppercase tracking-wide"
        : size === "icon_v2"
          ? "h-9 w-9 p-0 text-xs uppercase tracking-wide"
          : size === "icon_v3"
            ? "h-10 w-10 p-0 text-xs uppercase tracking-wide"
            : "px-3 py-2 text-sm font-semibold";

  return (
    <button className={cn(base, variantClasses, sizeClasses, className)} {...rest}>
      {icon && (
        <span className="mr-2 flex h-full items-center justify-center">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
