"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type EmptyFieldProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  message?: string;
};

export function EmptyField({
  className,
  title,
  message,
  children,
  ...props
}: EmptyFieldProps) {
  return (
    <div
      className={cn(
        "flex min-h-[120px] flex-col items-center justify-center rounded-sm border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400",
        className,
      )}
      {...props}
    >
      {children ? (
        children
      ) : (
        <>
          {title ? <p className="font-medium text-slate-200">{title}</p> : null}
          <p>{message || "Nothing to show yet."}</p>
        </>
      )}
    </div>
  );
}
