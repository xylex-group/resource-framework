"use client";

import type { PropsWithChildren } from "react";

export function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="whitespace-pre-wrap break-words text-xs text-slate-200">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
