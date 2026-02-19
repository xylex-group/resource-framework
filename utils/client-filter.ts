import type { QueryFilter } from "./query-parser";

/**
 * Coerces a value to its most appropriate type (number, boolean, timestamp, or original).
 * Attempts numeric conversion first, then boolean, then date parsing.
 *
 * @param v - The value to coerce
 * @returns The coerced value in its most appropriate type
 *
 * @example
 * ```tsx
 * coerceValue('123'); // 123
 * coerceValue('true'); // true
 * coerceValue('2024-01-01'); // 1704067200000 (timestamp)
 * ```
 */
export const coerceValue = (v: unknown): unknown => {
  if (v === null || v === undefined) return v;
  const asNum = Number(v);
  if (!isNaN(asNum) && String(v).trim() !== "") return asNum;
  if (String(v).toLowerCase() === "true") return true;
  if (String(v).toLowerCase() === "false") return false;
  const ts = Date.parse(String(v));
  if (!isNaN(ts)) return ts;
  return v;
};

/**
 * Applies client-side filtering to an array of rows based on QueryFilter conditions.
 * Supports various operators: eq, ==, !=, >, >=, <, <=, ~, !~, ^, $, contains, not_contains, starts_with, ends_with.
 * Values are automatically coerced for comparison.
 *
 * @param rows - Array of data rows to filter
 * @param filters - Array of QueryFilter objects defining filter conditions
 * @returns Filtered array of rows that match all filter conditions
 *
 * @example
 * ```tsx
 * const filtered = applyClientFilters(customers, [
 *   { column: 'status', op: 'eq', value: 'active' },
 *   { column: 'age', op: '>=', value: '18' }
 * ]);
 * ```
 */
export const applyClientFilters = <T extends Record<string, unknown>>(
  rows: T[],
  filters: QueryFilter[],
): T[] => {
  if (!Array.isArray(rows) || rows.length === 0) return rows;
  if (!Array.isArray(filters) || filters.length === 0) return rows;

  return rows.filter((row) => {
    for (const f of filters) {
      const lhsRaw = row?.[f.column];
      const rhsRaw = f.value;
      const lhs = coerceValue(lhsRaw);
      const rhs = coerceValue(rhsRaw);

      switch (f.op) {
        case "eq":
          if (lhs == null) return false;
          if (typeof lhs === "number" && typeof rhs === "number") {
            if (!(lhs === rhs)) return false;
          } else {
            if (String(lhs) !== String(rhs)) return false;
          }
          break;

        case "==": {
          if (lhs == null) return false;
          if (typeof lhs === "number" && typeof rhs === "number") {
            if (!(lhs === rhs)) return false;
          } else {
            if (String(lhs) !== String(rhs)) return false;
          }
          break;
        }

        case "!=":
          if (typeof lhs === "number" && typeof rhs === "number") {
            if (lhs === rhs) return false;
          } else if (String(lhs) === String(rhs)) return false;
          break;
        case ">":
          if (!(Number(lhs) > Number(rhs))) return false;
          break;
        case ">=":
          if (!(Number(lhs) >= Number(rhs))) return false;
          break;
        case "<":
          if (!(Number(lhs) < Number(rhs))) return false;
          break;
        case "<=":
          if (!(Number(lhs) <= Number(rhs))) return false;
          break;
        case "~": {
          const l = String(lhs ?? "").toLowerCase();
          const r = String(rhs ?? "").toLowerCase();
          if (!l.includes(r)) return false;
          break;
        }
        case "!~": {
          const l = String(lhs ?? "").toLowerCase();
          const r = String(rhs ?? "").toLowerCase();
          if (l.includes(r)) return false;
          break;
        }
        case "^": {
          const l = String(lhs ?? "").toLowerCase();
          const r = String(rhs ?? "").toLowerCase();
          if (!l.startsWith(r)) return false;
          break;
        }
        case "$": {
          const l = String(lhs ?? "").toLowerCase();
          const r = String(rhs ?? "").toLowerCase();
          if (!l.endsWith(r)) return false;
          break;
        }
        case "contains": {
          const l = String(lhs ?? "").toLowerCase();
          const r = String(rhs ?? "").toLowerCase();
          if (!l.includes(r)) return false;
          break;
        }
        case "not_contains": {
          const l = String(lhs ?? "").toLowerCase();
          const r = String(rhs ?? "").toLowerCase();
          if (l.includes(r)) return false;
          break;
        }
        case "starts_with": {
          const l = String(lhs ?? "").toLowerCase();
          const r = String(rhs ?? "").toLowerCase();
          if (!l.startsWith(r)) return false;
          break;
        }
        case "ends_with": {
          const l = String(lhs ?? "").toLowerCase();
          const r = String(rhs ?? "").toLowerCase();
          if (!l.endsWith(r)) return false;
          break;
        }
        default:
          break;
      }
    }
    return true;
  });
};
