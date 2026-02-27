"use client";

import type { HTMLProps } from "react";
import { cn } from "@/lib/utils";

export interface ErrorBlockProps extends HTMLProps<HTMLDivElement> {
  type?: "error" | "info";
  title?: string;
  content?: string;
  fullPage?: boolean;
  isError?: boolean;
  setIsError?: (value: boolean) => void;
  onRetry?: () => void;
}

export default function ErrorBlock({
  title,
  content,
  fullPage,
  onRetry,
  className,
  ...rest
}: ErrorBlockProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-red-500 bg-red-950/40 p-6 text-sm text-red-100",
        fullPage ? "min-h-[200px]" : "w-full",
        className,
      )}
      {...rest}
    >
      {title && (
        <p className="mb-2 text-lg font-semibold text-red-100">{title}</p>
      )}
      {content && <p className="text-sm text-red-200">{content}</p>}
      {onRetry && (
        <button
          className="mt-4 text-xs font-semibold uppercase tracking-wide text-red-300 hover:text-white"
          type="button"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
}
