import type { ReactNode } from "react";
import { safeTemplate } from "../utils/templates";
import type { ResourceData } from "@/lib/types";

export const getSectionGridClass = (n?: number): string => {
  switch (n) {
    case 1:
      return "grid-cols-1";
    case 3:
      return "grid-cols-1 sm:grid-cols-3";
    case 4:
      return "grid-cols-1 sm:grid-cols-4";
    case 2:
    default:
      return "grid-cols-1 sm:grid-cols-2";
  }
};

export const isEmptyValue = (val: unknown): boolean => {
  if (val == null) return true;
  if (typeof val === "string" && val.trim() === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  if (typeof val === "object" && Object.keys(val).length === 0) {
    return true;
  }
  return false;
};

export const getDrilldownTitle = (params: {
  drilldownTitle?: (data: ResourceData) => unknown;
  data: ResourceData | null;
  resourceLabel?: string;
  resourceName?: string;
}): ReactNode => {
  const raw = params.drilldownTitle
    ? params.drilldownTitle(params.data || {})
    : `${params.resourceLabel || params.resourceName || ""}`;
  if (typeof raw === "string" && raw.includes("{{")) {
    return safeTemplate(raw, params.data || {});
  }
  return raw as ReactNode;
};
