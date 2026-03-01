import type { ResourceFormRow, ResourceFormSchema } from "../resource-types";

export type ResolvedResourceForm = {
  id: string;
  slug: string;
  title: string;
  description: string;
  entity: string;
  schema: ResourceFormSchema;
  defaultValues: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFieldArray(value: unknown): boolean {
  return Array.isArray(value);
}

export function parseResourceFormSchema(
  value: unknown,
): ResourceFormSchema | null {
  if (!isRecord(value)) return null;
  if (typeof value.entity !== "string") return null;
  if (!isRecord(value.steps)) return null;

  for (const stepValue of Object.values(value.steps)) {
    if (!isFieldArray(stepValue)) {
      return null;
    }
  }

  return value as unknown as ResourceFormSchema;
}

export function resolveResourceFormRow(
  row: ResourceFormRow | Record<string, unknown>,
): ResolvedResourceForm | null {
  const schema = parseResourceFormSchema(
    (row as ResourceFormRow).schema ?? (row as ResourceFormRow).source_schema,
  );

  if (!schema) {
    return null;
  }

  const slug =
    typeof row.slug === "string" && row.slug.trim().length > 0
      ? row.slug
      : typeof row.entity === "string" && row.entity.trim().length > 0
        ? row.entity
        : String(row.resource_form_id ?? "resource-form");

  const title =
    typeof row.title === "string" && row.title.trim().length > 0
      ? row.title
      : slug
          .split(/[_-]/g)
          .filter(Boolean)
          .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
          .join(" ");

  return {
    id: String(row.resource_form_id ?? slug),
    slug,
    title,
    description:
      typeof row.description === "string" ? row.description : "",
    entity: schema.entity,
    schema,
    defaultValues: isRecord(row.default_values)
      ? row.default_values
      : {},
    isActive: row.is_active !== false,
    sortOrder:
      typeof row.sort_order === "number" ? row.sort_order : Number.MAX_SAFE_INTEGER,
  };
}

export function resolveResourceFormRows(
  rows: Array<ResourceFormRow | Record<string, unknown>>,
): ResolvedResourceForm[] {
  return rows
    .map(resolveResourceFormRow)
    .filter((row): row is ResolvedResourceForm => row !== null)
    .filter((row) => row.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}
