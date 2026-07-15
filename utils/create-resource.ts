import type { TableRowData } from "../resource-types";

export function compactCreatePayload(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) =>
      value !== undefined && value !== ""
    ),
  );
}

export function getMissingRequiredFields(
  values: Record<string, unknown>,
  requiredFields: string[],
): string[] {
  return requiredFields.filter((field) => {
    const value = values[field];
    return value == null || (typeof value === "string" && value.trim() === "");
  });
}

export function extractCreatedRow(value: unknown): TableRowData | null {
  if (Array.isArray(value)) {
    return extractCreatedRow(value[0]);
  }
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if ("data" in record) {
    return extractCreatedRow(record.data);
  }

  return record;
}
