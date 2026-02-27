"use client";

import type { HTMLAttributes } from "react";

export interface JsonBlockProps extends HTMLAttributes<HTMLElement> {
  data: unknown;
}

export function JsonBlock({ data, className }: JsonBlockProps) {
  return (
    <pre
      className={`whitespace-pre-wrap break-words text-xs text-slate-200 ${className ?? ""}`}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
