import { playgroundFormDefinitions } from "@xylex-group/resource-framework/demo/playground-forms";
import type { ResourceFormSchema } from "@xylex-group/resource-framework/resource-types";

export type PlaygroundResourceFormRow = {
  resource_form_id: string;
  slug: string;
  title: string;
  description: string;
  entity: string;
  schema: Record<string, unknown>;
  source_schema: Record<string, unknown>;
  source_schema_provider: string;
  default_values: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
};

export type ResolvedPlaygroundResourceForm = {
  id: string;
  slug: string;
  title: string;
  description: string;
  entity: string;
  schema: ResourceFormSchema;
  defaultValues: Record<string, unknown>;
};

export const playgroundResourceFormRows: PlaygroundResourceFormRow[] =
  playgroundFormDefinitions.map((definition, index) => ({
    resource_form_id: `resource-form-${definition.id}`,
    slug: definition.id,
    title: definition.title,
    description: definition.description,
    entity: definition.schema.entity,
    schema: definition.schema as unknown as Record<string, unknown>,
    source_schema: definition.schema as unknown as Record<string, unknown>,
    source_schema_provider: "resource-framework-demo",
    default_values:
      (definition.defaultValues as Record<string, unknown> | undefined) ?? {},
    is_active: true,
    sort_order: index,
  }));

function isSchema(value: unknown): value is ResourceFormSchema {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { entity?: unknown }).entity === "string" &&
      typeof (value as { steps?: unknown }).steps === "object",
  );
}

export function resolveResourceFormRows(
  rows: Array<Record<string, unknown>>,
): ResolvedPlaygroundResourceForm[] {
  return rows
    .map((row) => {
      const schema = isSchema(row.schema) ? row.schema : isSchema(row.source_schema) ? row.source_schema : null;
      if (!schema || row.is_active === false) {
        return null;
      }

      return {
        id: String(row.resource_form_id ?? row.slug ?? row.entity ?? "resource-form"),
        slug: String(row.slug ?? row.entity ?? "resource-form"),
        title: String(row.title ?? row.slug ?? row.entity ?? "Resource form"),
        description: typeof row.description === "string" ? row.description : "",
        entity: String(row.entity ?? schema.entity),
        schema,
        defaultValues:
          row.default_values && typeof row.default_values === "object"
            ? row.default_values as Record<string, unknown>
            : {},
      };
    })
    .filter((row): row is ResolvedPlaygroundResourceForm => row !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
}
