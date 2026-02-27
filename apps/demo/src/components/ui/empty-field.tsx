"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function EmptyField({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-h-[120px] flex-col items-center justify-center rounded-sm border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400",
        className,
      )}
      {...props}
    >
      <p>Nothing to show yet.</p>
    </div>
  );
}
