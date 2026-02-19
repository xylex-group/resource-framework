/**
 * Coerces a value to the appropriate JavaScript type based on a datatype string.
 * Handles number and boolean conversions, leaving other types unchanged.
 *
 * @param val - The value to coerce
 * @param datatype - The target datatype ('number', 'boolean', or other)
 * @returns The coerced value, or the original value if coercion fails or datatype is unrecognized
 *
 * @example
 * ```tsx
 * coerceByDatatype('123', 'number'); // 123
 * coerceByDatatype('true', 'boolean'); // true
 * coerceByDatatype('1', 'boolean'); // true
 * coerceByDatatype('hello', 'string'); // 'hello'
 * ```
 */
export function coerceByDatatype(val: unknown, datatype?: string): unknown {
  if (val === "" || val == null) return val;
  switch (datatype) {
    case "number": {
      const n = Number(val);
      return isNaN(n) ? val : n;
    }
    case "boolean": {
      if (typeof val === "boolean") return val;
      const s = String(val).toLowerCase();
      return s === "true" || s === "1";
    }
    default:
      return val;
  }
}
