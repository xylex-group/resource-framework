"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("text-xs uppercase tracking-[0.3em] text-slate-400", className)}
      {...props}
    />
  );
}

export function TableCellV2({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-3 py-2 text-sm text-slate-100", className)}
      {...props}
    />
  );
}
