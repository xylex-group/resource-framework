"use client";

import {
  forwardRef,
  type DetailedHTMLProps,
  type InputHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export type InputProps = Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  "size"
> & {
  size?: string | number;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, size, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-sm border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500",
        className,
      )}
      size={typeof size === "number" ? size : undefined}
      {...props}
    />
  );
});
