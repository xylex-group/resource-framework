/**
 * Checks if a value is considered empty.
 * Returns true for null, undefined, empty strings (after trim), empty arrays, and empty objects.
 *
 * @param val - The value to check
 * @returns True if the value is empty, false otherwise
 *
 * @example
 * ```tsx
 * isEmpty(null); // true
 * isEmpty(''); // true
 * isEmpty('  '); // true
 * isEmpty([]); // true
 * isEmpty({}); // true
 * isEmpty('hello'); // false
 * isEmpty([1, 2]); // false
 * ```
 */
export const isEmpty = (val: unknown): boolean => {
  if (val == null) return true;
  if (typeof val === "string" && val.trim() === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  if (typeof val === "object" && Object.keys(val).length === 0) return true;
  return false;
};
