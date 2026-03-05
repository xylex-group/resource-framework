"use client";

import { useMemo } from "react";
import type { ResourceRoute } from "../resource-types";

interface ContextSettings {
  rows_per_page?: string | number;
}

interface ColumnConfig {
  column_name?: string;
  hidden?: boolean;
  cell_value_mask_label?: string;
}

/**
 * Hook to compute table configuration settings based on resource and user preferences.
 * Determines display context, row limit, caching behavior, and visible columns.
 *
 * @param resourceName - The name of the resource
 * @param resource - The resource route configuration
 * @param contextSettings - User-specific context settings including rows_per_page
 * @param cacheExperimental - Global cache flag
 * @returns Object containing displayContext, limit, noCache flag, and columns array
 *
 * @example
 * ```tsx
 * const { displayContext, limit, noCache, columns } = useTableConfiguration(
 *   'customers',
 *   resource,
 *   settings,
 *   true
 * );
 * ```
 */
export const useTableConfiguration = (
  resourceName: string | undefined,
  resource: ResourceRoute | null,
  contextSettings: ContextSettings | undefined,
  cacheExperimental: boolean
) => {
  const displayContext = useMemo(() => `v2_${resourceName}`, [resourceName]);

  const limit = useMemo(() => {
    const userSetting = contextSettings?.rows_per_page;
    if (userSetting && typeof userSetting === "string") {
      const parsed = Number.parseInt(userSetting, 10);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
    if (typeof userSetting === "number" && userSetting > 0) return userSetting;
    return 100;
  }, [contextSettings?.rows_per_page]);

  const noCache = useMemo(() => {
    const flag = resource?.force_no_cache;
    if (flag === true) return true;
    if (flag === false) return false;
    return !cacheExperimental;
  }, [resource, cacheExperimental]);

  const columns = useMemo(() => {
    try {
      const configured = resource?.columns;
      if (!Array.isArray(configured) || configured.length === 0) {
        return [] as string[];
      }

      const referencedColumns = new Set<string>();
      configured.forEach((c: string | ColumnConfig) => {
        if (typeof c === "object" && c?.cell_value_mask_label) {
          const matches = c.cell_value_mask_label.matchAll(/\{\{(.*?)\}\}/g);
          for (const match of matches) {
            const columnName = match[1]?.trim();
            if (columnName && !columnName.includes(".")) {
              referencedColumns.add(columnName);
            }
          }
        }
      });

      const base = configured
        .filter(
          (c: string | ColumnConfig) => !(typeof c === "object" && c?.hidden)
        )
        .map((c: string | ColumnConfig) =>
          typeof c === "string" ? c : c.column_name
        );

      const withId = new Set<string>(
        [
          ...base,
          ...Array.from(referencedColumns),
          resource?.idColumn || "id",
          resource?.avatar_column || undefined,
        ].filter(Boolean) as string[]
      );
      return Array.from(withId);
    } catch {
      return [] as string[];
    }
  }, [resource]);

  return {
    displayContext,
    limit,
    noCache,
    columns,
  };
};
