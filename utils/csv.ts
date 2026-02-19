/**
 * Infers the data type of a value for CSV import purposes.
 * Detects null, number, boolean, date, and string types.
 *
 * @param value - The value to analyze
 * @returns Type string: 'null', 'number', 'boolean', 'date', or 'string'
 *
 * @example
 * ```tsx
 * inferValueType(123); // 'number'
 * inferValueType('2024-01-01'); // 'date'
 * inferValueType('true'); // 'string' (not parsed as boolean)
 * ```
 */
export function inferValueType(value: unknown): string {
  if (value === null || typeof value === "undefined" || value === "") {
    return "null";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return "number";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  if (value instanceof Date) {
    return "date";
  }
  const asString = String(value);
  if (/^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$/.test(asString)) {
    return "date";
  }
  if (/^[-+]?\d*(?:\.\d+)?$/.test(asString) && asString.trim() !== "") {
    return "number";
  }
  return "string";
}

/**
 * Infers data types for CSV columns by sampling rows and determining the most common type.
 * Samples up to 200 rows to determine the predominant type for each column.
 *
 * @param rows - Array of row objects from the CSV
 * @param headers - Array of column header names
 * @returns Object mapping header names to inferred type strings
 *
 * @example
 * ```tsx
 * const types = inferCsvTypes(rows, ['name', 'age', 'created_at']);
 * // types = { name: 'string', age: 'number', created_at: 'date' }
 * ```
 */
export function inferCsvTypes(
  rows: Array<Record<string, unknown>>,
  headers: string[],
): Record<string, string> {
  const typeCountsByHeader: Record<string, Record<string, number>> = {};
  headers.forEach((header) => (typeCountsByHeader[header] = {}));
  const sampleRows = rows.slice(0, Math.min(200, rows.length));
  sampleRows.forEach((row) => {
    headers.forEach((header) => {
      const detectedType = inferValueType(row[header]);
      typeCountsByHeader[header][detectedType] =
        (typeCountsByHeader[header][detectedType] || 0) + 1;
    });
  });
  const result: Record<string, string> = {};
  headers.forEach((header) => {
    const counts = typeCountsByHeader[header];
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    result[header] = sorted.length > 0 ? sorted[0][0] : "unknown";
  });
  return result;
}

/**
 * Checks if a CSV column type is compatible with a database table column type.
 * Handles various database type names (int, numeric, bool, timestamp, etc.).
 *
 * @param csvType - The inferred CSV column type
 * @param tableType - The database column type
 * @returns True if types are compatible, false otherwise
 *
 * @example
 * ```tsx
 * isTypeCompatible('number', 'integer'); // true
 * isTypeCompatible('date', 'timestamp'); // true
 * isTypeCompatible('string', 'boolean'); // false
 * ```
 */
export function isTypeCompatible(csvType?: string, tableType?: string): boolean {
  if (!csvType || csvType === "unknown" || csvType === "null") {
    return true;
  }
  if (!tableType || tableType === "unknown") {
    return true;
  }
  const normalizedTable = String(tableType).toLowerCase();
  const normalizedCsv = String(csvType).toLowerCase();
  const tableIsNumber = /int|numeric|decimal|double|real|float|number/.test(
    normalizedTable,
  );
  const tableIsBoolean = /bool/.test(normalizedTable);
  const tableIsDate = /date|timestamp|time/.test(normalizedTable);
  if (normalizedCsv === "number") return tableIsNumber;
  if (normalizedCsv === "boolean") return tableIsBoolean;
  if (normalizedCsv === "date") return tableIsDate;
  return true;
}


