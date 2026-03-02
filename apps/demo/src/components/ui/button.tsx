"use client";

import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "ghost"
  | "outline"
  | "outline_dashed"
  | "brand"
  | "icon_v2"
  | "icon_v3"
  | "secondary"
  | "destructive"
  | "link";

type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "icon"
  | "icon_v2"
  | "icon_v3"
  | "icon-title";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  asChild?: boolean;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  icon,
  children,
  asChild = false,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const variantClasses =
    variant === "ghost"
      ? "bg-transparent text-slate-200 hover:bg-slate-800/50 focus-visible:ring-slate-500"
      : variant === "outline"
        ? "bg-transparent border border-slate-700 text-slate-200 hover:border-slate-500 focus-visible:ring-slate-500"
        : variant === "outline_dashed"
          ? "bg-transparent border border-dashed border-slate-700 text-slate-200 hover:border-slate-500 focus-visible:ring-slate-500"
          : variant === "brand"
            ? "bg-sky-600 text-white hover:bg-sky-500 focus-visible:ring-sky-500"
            : variant === "icon_v2"
              ? "bg-slate-900 border border-slate-700 text-slate-200 shadow-inner hover:border-slate-500 focus-visible:ring-slate-500"
              : variant === "icon_v3"
                ? "bg-white/5 text-white hover:bg-white/20 focus-visible:ring-white"
                : variant === "secondary"
                  ? "bg-slate-700 text-slate-100 hover:bg-slate-600 focus-visible:ring-slate-500"
                  : variant === "destructive"
                    ? "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500"
                    : variant === "link"
                      ? "bg-transparent p-0 text-sky-400 underline-offset-2 hover:underline focus-visible:ring-sky-500"
                      : "bg-slate-800 text-white hover:bg-slate-700 focus-visible:ring-slate-500";

  const sizeClasses =
    size === "xs"
      ? "text-xs px-2 py-1"
      : size === "sm"
        ? "text-xs px-2 py-1"
        : size === "icon"
          ? "h-10 w-10 p-0 text-xs uppercase tracking-wide"
          : size === "icon_v2"
            ? "h-9 w-9 p-0 text-xs uppercase tracking-wide"
            : size === "icon_v3"
              ? "h-10 w-10 p-0 text-xs uppercase tracking-wide"
              : size === "icon-title"
                ? "h-8 w-8 p-0"
                : "px-3 py-2 text-sm font-semibold";

  const mergedClassName = cn(base, variantClasses, sizeClasses, className);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string; children?: ReactNode }>;
    const childContent = (
      <>
        {icon ? (
          <span className="mr-2 flex h-full items-center justify-center">{icon}</span>
        ) : null}
        {child.props.children}
      </>
    );

    return cloneElement(child, {
      ...rest,
      className: cn(mergedClassName, child.props.className),
      children: childContent,
    });
  }

  return (
    <button className={mergedClassName} {...rest}>
      {icon ? (
        <span className="mr-2 flex h-full items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
