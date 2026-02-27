"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  config?: Record<string, unknown>;
  children: ReactNode;
}

export function ChartContainer({
  className,
  config,
  children,
  ...props
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-200",
        className,
      )}
      {...props}
    >
      {config && (
        <pre className="sr-only">{JSON.stringify(config)}</pre>
      )}
      {children}
    </div>
  );
}
