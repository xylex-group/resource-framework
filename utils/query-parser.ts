import type { QuerySort, QueryFilter } from "../resource-types";

export type { QuerySort, QueryFilter };

/**
 * Parses sorting parameters from URL search params.
 * Extracts "sortby" and "sortdir" parameters to create a QuerySort object.
 *
 * @param searchParams - URLSearchParams from the current URL
 * @returns QuerySort object with column id and direction, or null if no sort params
 *
 * @example
 * ```tsx
 * const sort = parseQuerySort(searchParams);
 * // sort = { id: 'created_at', desc: true }
 * ```
 */
export const parseQuerySort = (searchParams: URLSearchParams | null): QuerySort => {
  try {
    const sortBy = searchParams?.get("sortby");
    const sortDir = (searchParams?.get("sortdir") || "desc").toLowerCase();
    if (sortBy && typeof sortBy === "string") {
      return { id: sortBy, desc: sortDir !== "asc" };
    }
  } catch {}
  return null;
};

/**
 * Parses filter parameters from URL search params with operator support.
 * Supports various operators: >=, <=, !=, >, <, ~, !~, ^, $, ==, and named operators.
 *
 * @param searchParams - URLSearchParams from the current URL
 * @param filterableMeta - Optional metadata about which columns are filterable
 * @returns Array of QueryFilter objects with column, operator, and value
 *
 * @example
 * ```tsx
 * const filters = parseQueryFilters(searchParams, {
 *   amount: { filterable: true, datatype: 'number' }
 * });
 * // filters = [{ column: 'amount', op: '>=', value: '100' }]
 * ```
 */
export const parseQueryFilters = (
  searchParams: URLSearchParams | null,
  filterableMeta?: Record<string, { filterable?: boolean; datatype?: string }>,
): QueryFilter[] => {
  const filters: QueryFilter[] = [];
  try {
    if (!searchParams) return filters;

    const operatorRegex = /^(.*?)(>=|<=|!=|>|<|~|!~|\^|\$|==)$/;

    for (const [rawKey, rawValue] of searchParams.entries()) {
      if (rawKey === "sortby" || rawKey === "sortdir" || rawKey === "rows_per_page") {
        continue;
      }

      const key = String(rawKey);
      const val = String(rawValue ?? "");

      const keyMatch = key.match(operatorRegex);
      if (keyMatch) {
        const column = keyMatch[1].trim();
        const op = keyMatch[2];
        const value = val;
        const meta = filterableMeta?.[column];
        if (meta && meta.filterable === false) {
          continue;
        }
        if (column && (!meta || meta.filterable)) {
          filters.push({ column, op, value });
          continue;
        }
      }

      const valueOpMatch = val.match(/^(>=|<=|!=|>|<|~|!~|\^|\$|==)\s*(.*)$/);
      const namedOpMatch = val.match(
        /^(contains|not_contains|starts_with|ends_with|equals)\s*=\s*(.*)$/i,
      );

      if (valueOpMatch) {
        const column = key;
        const op = valueOpMatch[1];
        const rhs = valueOpMatch[2];
        const meta = filterableMeta?.[column];
        if (meta && meta.filterable === false) {
          continue;
        }
        if (!meta || meta.filterable) {
          filters.push({ column, op, value: rhs });
        }
        continue;
      }

      if (namedOpMatch) {
        const column = key;
        const opName = (namedOpMatch[1] || "").toLowerCase();
        const rhs = namedOpMatch[2] || "";
        const opMap: Record<string, string> = {
          contains: "contains",
          not_contains: "not_contains",
          starts_with: "starts_with",
          ends_with: "ends_with",
          equals: "==",
        };
        const op = opMap[opName];
        const meta = filterableMeta?.[column];
        if (meta && meta.filterable === false) {
          continue;
        }
        if ((!meta || meta.filterable) && op) {
          filters.push({ column, op, value: rhs });
        }
        continue;
      }

      const meta = filterableMeta?.[key];
      if (meta && meta.filterable === false) {
        continue;
      }
      if (!meta || meta.filterable) {
        filters.push({
          column: key,
          op: "eq",
          value: val,
        });
      }
    }
  } catch {}
  return filters;
};
