"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-700 bg-slate-950/60 p-4 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
