"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "h-4 rounded-sm bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800",
        className,
      )}
      {...props}
    />
  );
}
