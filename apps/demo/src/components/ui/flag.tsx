"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FlagProps = HTMLAttributes<HTMLSpanElement> & {
  country?: string;
  size?: number;
  includeCountryCode?: boolean;
  children?: ReactNode;
};

export function Flag({
  country,
  size = 16,
  includeCountryCode,
  className,
  children,
  style,
  ...props
}: FlagProps) {
  const display = includeCountryCode && country
    ? country.toUpperCase()
    : children;

  const mergedStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: size,
    height: size,
    lineHeight: 1,
    ...style,
  };

  return (
    <span
      className={cn(
        "rounded-full bg-slate-800 text-xs font-semibold uppercase tracking-tight text-slate-200",
        className,
      )}
      style={mergedStyle}
      {...props}
    >
      {display}
    </span>
  );
}
