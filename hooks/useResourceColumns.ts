import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { defineColumns } from "@/packages/resource-framework/constructors/define-columns";
import type {
  ResourceFieldSpec,
  ResourceRouteEntry,
} from "@/packages/resource-framework/resource-types";

/**
 * Hook to convert resource route column specifications into TanStack Table column definitions.
 * Memoizes the result to prevent unnecessary recalculations.
 *
 * @param route - The resource route entry containing column specifications
 * @returns Array of TanStack Table ColumnDef objects
 *
 * @example
 * ```tsx
 * function DataTable() {
 *   const route = getResourceRoute('customers');
 *   const columns = useResourceColumns(route);
 *
 *   return <Table columns={columns} data={data} />;
 * }
 * ```
 */
export function useResourceColumns<TData = Record<string, unknown>>(
  route: ResourceRouteEntry | null,
) {
  return React.useMemo<ColumnDef<TData>[]>(() => {
    const specs = (route?.columns ?? []) as ResourceFieldSpec[];
    try {
      return defineColumns(specs) as ColumnDef<TData>[];
    } catch {
      return [];
    }
  }, [route]);
}
