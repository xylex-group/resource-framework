"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

// Local type definitions (replaces @suitsbooks/ui)
export type AdvancedFilter = {
  field: string;
  operator: string;
  values: unknown[];
};

export type FilterFieldConfig<T = unknown> = {
  key: string;
  type?: string;
  options?: Array<{ label: string; value: T }>;
};

// Local utility function (replaces @suitsbooks/ui)
function createAdvancedFilter<T = unknown>(
  field: string,
  operator: string,
  values: T[]
): AdvancedFilter {
  return { field, operator, values };
}

/**
 * Hook to manage advanced filtering with URL synchronization.
 * Parses filter operators from URL parameters and provides methods to add/remove filters.
 *
 * @param searchParams - URLSearchParams from the current URL
 * @param filterFields - Array of filter field configurations defining available filters
 * @returns Object containing filters array and methods to manipulate them
 *
 * @example
 * ```tsx
 * function FilterableTable() {
 *   const searchParams = useSearchParams();
 *   const { filters, addFilter, removeFilter } = useAdvancedFilters(
 *     searchParams,
 *     [{ key: 'status', type: 'select', options: [...] }]
 *   );
 * }
 * ```
 */
export const useAdvancedFilters = (
  searchParams: URLSearchParams | null,
  filterFields: FilterFieldConfig<unknown>[],
) => {
  const [advFilters, setAdvFilters] = useState<AdvancedFilter[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  // Parse filters from URL params
  const parsedFilters = React.useMemo(() => {
    const searchParamsStr = searchParams?.toString();
    try {
      const next: AdvancedFilter[] = [];
      if (searchParams) {
        const operatorValueRegex = /^(>=|<=|!=|>|<)\s*(.*)$/;
        const perColumnOps = new Map<string, { op: string; value: string }[]>();
        const eqGrouped = new Map<string, string[]>();
        const fieldKeys = new Set<string>(
          (filterFields || []).map((f) => String(f.key)),
        );

        for (const [k, v] of searchParams.entries()) {
          const key = String(k);
          if (!fieldKeys.has(key)) continue;
          const val = String(v ?? "");
          const m = val.match(operatorValueRegex);
          if (m) {
            const op = m[1];
            const rhs = m[2];
            const arr = perColumnOps.get(key) || [];
            arr.push({ op, value: rhs });
            perColumnOps.set(key, arr);
          } else if (val.trim() !== "") {
            const arr = eqGrouped.get(key) || [];
            arr.push(val);
            eqGrouped.set(key, arr);
          }
        }

        perColumnOps.forEach((pairs, field) => {
          const gte = pairs.find((p) => p.op === ">=");
          const lte = pairs.find((p) => p.op === "<=");
          if (gte && lte) {
            next.push(
              createAdvancedFilter<string>(field, "between", [
                gte.value,
                lte.value,
              ]),
            );
          }
        });

        perColumnOps.forEach((pairs, field) => {
          pairs.forEach((p) => {
            if (
              (p.op === ">=" || p.op === "<=") &&
              perColumnOps
                .get(field)
                ?.some(
                  (x) =>
                    (x.op === ">=" && p.op === "<=") ||
                    (x.op === "<=" && p.op === ">="),
                )
            ) {
              return;
            }
            const opMap: Record<string, string> = {
              ">": "greater_than",
              "<": "less_than",
              ">=": "greater_than",
              "<=": "less_than",
              "!=": "not_equals",
            };
            const mapped = opMap[p.op] || "is";
            next.push(createAdvancedFilter<string>(field, mapped, [p.value]));
          });
        });

        eqGrouped.forEach((values, field) => {
          next.push(createAdvancedFilter<string>(field, "is", values));
        });
      }
      return next;
    } catch {
      return [];
    }
  }, [searchParams, filterFields]);

  // Update state when parsed filters change
  useEffect(() => {
    setAdvFilters(parsedFilters);
  }, [parsedFilters]);

  const handleAdvFiltersChange = useCallback(
    (nextFilters: AdvancedFilter[]) => {
      setAdvFilters(nextFilters);
      try {
        const current = new URLSearchParams(searchParams?.toString() || "");
        const fieldKeys = new Set<string>(
          (filterFields || []).map((f) => String(f.key)),
        );
        Array.from(current.keys()).forEach((k) => {
          if (fieldKeys.has(k)) current.delete(k);
        });

        current.delete("eq_column");
        current.delete("eq_value");

        nextFilters.forEach((f) => {
          const field = String(f.field);
          if (!field) return;
          const vals = Array.isArray(f.values) ? f.values : [];
          const cleanVals = vals
            .map((v) => (v == null ? "" : String(v)))
            .filter((s) => s.trim() !== "");
          if (f.operator === "empty" || f.operator === "not_empty") return;
          if (
            f.operator === "is" ||
            f.operator === "equals" ||
            f.operator === "is_any_of"
          ) {
            cleanVals.forEach((s) => {
              current.append(field, s);
            });
            return;
          }
          if (f.operator === "not_equals") {
            cleanVals.forEach((s) => current.append(field, `!= ${s}`));
            return;
          }
          if (f.operator === "greater_than") {
            cleanVals.forEach((s) => current.append(field, `> ${s}`));
            return;
          }
          if (f.operator === "less_than") {
            cleanVals.forEach((s) => current.append(field, `< ${s}`));
            return;
          }
          if (f.operator === "contains") {
            cleanVals.forEach((s) => current.append(field, `contains=${s}`));
            return;
          }
          if (f.operator === "not_contains") {
            cleanVals.forEach((s) =>
              current.append(field, `not_contains=${s}`),
            );
            return;
          }
          if (f.operator === "starts_with") {
            cleanVals.forEach((s) => current.append(field, `starts_with=${s}`));
            return;
          }
          if (f.operator === "ends_with") {
            cleanVals.forEach((s) => current.append(field, `ends_with=${s}`));
            return;
          }
          if (f.operator === "between") {
            const start = cleanVals[0];
            const end = cleanVals[1];
            if (start != null) current.append(field, `>= ${start}`);
            if (end != null) current.append(field, `<= ${end}`);
            return;
          }
          cleanVals.forEach((s) => {
            current.append(field, s);
          });
        });
        const qs = current.toString();
        const href = qs ? `${pathname}?${qs}` : `${pathname}`;
        router.replace(href);
      } catch {}
    },
    [router, pathname, searchParams, filterFields],
  );

  return { advFilters, handleAdvFiltersChange };
};
