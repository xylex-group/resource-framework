"use client";

import type { ReactNode } from "react";

export interface FiltersProps {
  filters?: Array<Record<string, unknown>>;
  onChange?: (filters: Array<Record<string, unknown>>) => void;
  children?: ReactNode;
}

export function Filters({ children }: FiltersProps) {
  return <div>{children}</div>;
}
