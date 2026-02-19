import * as React from "react";
import type { QueryFilter } from "../resource-types";

export type { QueryFilter };

/**
 * Hook to parse and manage query filters from URL search parameters.
 * Extracts filters from the "filters" query parameter and validates the structure.
 *
 * @param searchParams - URLSearchParams object from the current URL
 * @returns Array of validated QueryFilter objects
 *
 * @example
 * ```tsx
 * function FilteredTable() {
 *   const searchParams = useSearchParams();
 *   const filters = useQueryFilters(searchParams);
 *
 *   // filters = [{ column: 'status', op: 'eq', value: 'active' }]
 * }
 * ```
 */
export function useQueryFilters(searchParams: URLSearchParams | null) {
  const [filters, setFilters] = React.useState<QueryFilter[]>([]);
  React.useEffect(() => {
    if (!searchParams) {
      setFilters([]);
      return;
    }
    const parsed: QueryFilter[] = [];
    const raw = searchParams.get("filters");
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (const f of arr) {
            if (f && typeof f.column === "string" && typeof f.op === "string") {
              parsed.push({
                column: f.column,
                op: f.op,
                value: f.value ?? null,
              });
            }
          }
        }
      } catch {
        // ignore
      }
    }
    setFilters(parsed);
  }, [searchParams]);

  return filters;
}


