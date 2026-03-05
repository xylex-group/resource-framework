import type {
  ResourceFormField,
  ResourceFormSubmissionConfig,
  ResourceFormRow,
  ResourceFormSchema,
} from "../types/resource-forms";
import { normalizeResourceFormSubmissionConfig } from "./resource-form-submissions";

export type ResourceFormValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type ResourceFormValidationResult<T> = {
  ok: boolean;
  value: T | null;
  issues: ResourceFormValidationIssue[];
};

export type ResourceFormDefinition = {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  schema: ResourceFormSchema;
  schemaVersion?: number;
  migrationKey?: string | null;
  defaultValues?: Record<string, unknown>;
  isActive?: boolean;
  sortOrder?: number;
  sourceSchemaProvider?: string | null;
  sourceSchemaUrl?: string | null;
  submissionConfig?: ResourceFormSubmissionConfig;
};

export type DefinedResourceForm = ResourceFormDefinition & {
  slug: string;
};

export type ResolvedResourceForm = {
  id: string;
  slug: string;
  title: string;
  description: string;
  entity: string;
  schema: ResourceFormSchema;
  schemaVersion: number;
  migrationKey: string;
  defaultValues: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  sourceSchemaProvider?: string | null;
  sourceSchemaUrl?: string | null;
  submissionConfig: ResourceFormSubmissionConfig;
};

const VALID_RESOURCE_FORM_TYPES = new Set<ResourceFormField["type"]>([
  "text",
  "tel",
  "date",
  "number",
  "card_select",
  "plan_select",
  "pay_stripe",
  "country",
  "text_area",
  "file_upload",
  "dob",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "resource-form";
}

function normalizeSchemaVersion(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function pushIssue(
  issues: ResourceFormValidationIssue[],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ path, code, message });
}

function validateResourceFormField(
  field: unknown,
  path: string,
): ResourceFormValidationIssue[] {
  const issues: ResourceFormValidationIssue[] = [];

  if (!isRecord(field)) {
    pushIssue(issues, path, "field_invalid", "Field must be an object.");
    return issues;
  }

  if (!isNonEmptyString(field.key)) {
    pushIssue(issues, `${path}.key`, "field_key_invalid", "Field key must be a non-empty string.");
  }

  if (!isNonEmptyString(field.label)) {
    pushIssue(issues, `${path}.label`, "field_label_invalid", "Field label must be a non-empty string.");
  }

  if (!isNonEmptyString(field.type)) {
    pushIssue(issues, `${path}.type`, "field_type_missing", "Field type is required.");
    return issues;
  }

  if (!VALID_RESOURCE_FORM_TYPES.has(field.type as ResourceFormField["type"])) {
    pushIssue(
      issues,
      `${path}.type`,
      "field_type_invalid",
      `Unsupported field type \"${String(field.type)}\".`,
    );
  }

  if ((field.type === "card_select" || field.type === "plan_select") && !Array.isArray(field.options)) {
    pushIssue(
      issues,
      `${path}.options`,
      "field_options_missing",
      `${String(field.type)} fields must declare an options array.`,
    );
  }

  if (Array.isArray(field.options)) {
    field.options.forEach((option, optionIndex) => {
      const optionPath = `${path}.options[${optionIndex}]`;
      if (!isRecord(option)) {
        pushIssue(issues, optionPath, "field_option_invalid", "Field option must be an object.");
        return;
      }
      if (!isNonEmptyString(option.value)) {
        pushIssue(issues, `${optionPath}.value`, "field_option_value_invalid", "Field option value must be a non-empty string.");
      }
      if (!isNonEmptyString(option.title) && !isNonEmptyString(option.label)) {
        pushIssue(issues, `${optionPath}.title`, "field_option_title_invalid", "Field option must declare a title or label.");
      }
    });
  }

  return issues;
}

export function validateResourceFormSchema(
  value: unknown,
): ResourceFormValidationResult<ResourceFormSchema> {
  const issues: ResourceFormValidationIssue[] = [];

  if (!isRecord(value)) {
    pushIssue(issues, "schema", "schema_invalid", "Schema must be an object.");
    return { ok: false, value: null, issues };
  }

  if (!isNonEmptyString(value.entity)) {
    pushIssue(issues, "schema.entity", "entity_invalid", "Schema entity must be a non-empty string.");
  }

  if (!isRecord(value.steps)) {
    pushIssue(issues, "schema.steps", "steps_invalid", "Schema steps must be an object keyed by step name.");
  } else {
    const stepEntries = Object.entries(value.steps);
    if (stepEntries.length === 0) {
      pushIssue(issues, "schema.steps", "steps_empty", "Schema must define at least one step.");
    }

    stepEntries.forEach(([stepKey, fields], stepIndex) => {
      const stepPath = `schema.steps.${stepKey}`;
      if (!isNonEmptyString(stepKey)) {
        pushIssue(issues, stepPath, "step_key_invalid", `Step key at index ${stepIndex} must be non-empty.`);
      }
      if (!Array.isArray(fields)) {
        pushIssue(issues, stepPath, "step_fields_invalid", "Step fields must be an array.");
        return;
      }
      if (fields.length === 0) {
        pushIssue(issues, stepPath, "step_fields_empty", "Step must contain at least one field.");
      }

      const seenFieldKeys = new Set<string>();
      fields.forEach((field, fieldIndex) => {
        const fieldPath = `${stepPath}[${fieldIndex}]`;
        const fieldIssues = validateResourceFormField(field, fieldPath);
        issues.push(...fieldIssues);

        if (isRecord(field) && isNonEmptyString(field.key)) {
          if (seenFieldKeys.has(field.key)) {
            pushIssue(issues, `${fieldPath}.key`, "field_key_duplicate", `Duplicate field key \"${field.key}\" inside step \"${stepKey}\".`);
          }
          seenFieldKeys.add(field.key);
        }
      });
    });
  }

  if (value.step_order !== undefined) {
    if (!Array.isArray(value.step_order)) {
      pushIssue(issues, "schema.step_order", "step_order_invalid", "step_order must be an array of step keys.");
    } else if (isRecord(value.steps)) {
      const stepKeys = new Set(Object.keys(value.steps));
      value.step_order.forEach((step, index) => {
        if (!isNonEmptyString(step)) {
          pushIssue(issues, `schema.step_order[${index}]`, "step_order_entry_invalid", "step_order entries must be non-empty strings.");
          return;
        }
        if (!stepKeys.has(step)) {
          pushIssue(issues, `schema.step_order[${index}]`, "step_order_unknown_step", `step_order references unknown step \"${step}\".`);
        }
      });
    }
  }

  if (issues.length > 0) {
    return { ok: false, value: null, issues };
  }

  return {
    ok: true,
    value: value as unknown as ResourceFormSchema,
    issues: [],
  };
}

export function formatResourceFormIssues(
  issues: ResourceFormValidationIssue[],
): string {
  if (issues.length === 0) {
    return "No validation issues.";
  }

  return issues
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join("\n");
}

export function parseResourceFormSchema(
  value: unknown,
): ResourceFormSchema | null {
  const result = validateResourceFormSchema(value);
  return result.ok ? result.value : null;
}

export function getOrderedResourceFormSteps(
  schema: ResourceFormSchema,
): Array<[string, ResourceFormField[]]> {
  const stepEntries = Object.entries(schema.steps || {}) as Array<[
    string,
    ResourceFormField[],
  ]>;
  const baseKeys = stepEntries.map(([name]) => name);
  const order = Array.isArray(schema.step_order) ? schema.step_order : [];

  if (order.length === 0) {
    return stepEntries;
  }

  const orderIndex = new Map<string, number>();
  order.forEach((step, index) => {
    orderIndex.set(step, index);
  });

  return stepEntries.slice().sort((a, b) => {
    const [aName] = a;
    const [bName] = b;
    const aOrder = orderIndex.get(aName);
    const bOrder = orderIndex.get(bName);

    if (typeof aOrder === "number" && typeof bOrder === "number") {
      return aOrder - bOrder;
    }
    if (typeof aOrder === "number") {
      return -1;
    }
    if (typeof bOrder === "number") {
      return 1;
    }

    return baseKeys.indexOf(aName) - baseKeys.indexOf(bName);
  });
}

export function getResourceFormFieldKeys(
  schema: ResourceFormSchema,
): string[] {
  return getOrderedResourceFormSteps(schema)
    .flatMap(([, fields]) => fields)
    .map((field) => field.key);
}

export function getRequiredResourceFormFieldKeys(
  schema: ResourceFormSchema,
): string[] {
  return getOrderedResourceFormSteps(schema)
    .flatMap(([, fields]) => fields)
    .filter((field) => field.required)
    .map((field) => field.key);
}

export function defineResourceFormSchema(
  schema: ResourceFormSchema,
): ResourceFormSchema {
  const result = validateResourceFormSchema(schema);
  if (!result.ok) {
    throw new Error(formatResourceFormIssues(result.issues));
  }
  return schema;
}

export function defineResourceForm(
  definition: ResourceFormDefinition,
): DefinedResourceForm {
  if (!isNonEmptyString(definition.id)) {
    throw new Error("Resource form definition id must be a non-empty string.");
  }
  if (!isNonEmptyString(definition.title)) {
    throw new Error(`Resource form \"${definition.id}\" must declare a title.`);
  }

  defineResourceFormSchema(definition.schema);

  if (
    definition.defaultValues !== undefined &&
    !isRecord(definition.defaultValues)
  ) {
    throw new Error(
      `Resource form \"${definition.id}\" defaultValues must be an object if provided.`,
    );
  }

  if (
    definition.schemaVersion !== undefined &&
    normalizeSchemaVersion(definition.schemaVersion) === null
  ) {
    throw new Error(
      `Resource form \"${definition.id}\" schemaVersion must be a positive integer if provided.`,
    );
  }

  if (
    definition.migrationKey !== undefined &&
    definition.migrationKey !== null &&
    !isNonEmptyString(definition.migrationKey)
  ) {
    throw new Error(
      `Resource form \"${definition.id}\" migrationKey must be a non-empty string if provided.`,
    );
  }

  return {
    ...definition,
    slug: normalizeSlug(definition.slug ?? definition.id),
    schemaVersion: normalizeSchemaVersion(definition.schemaVersion) ?? 1,
    migrationKey: definition.migrationKey ?? normalizeSlug(definition.slug ?? definition.id),
  };
}

export function createResourceFormRow(
  definition: ResourceFormDefinition,
  options?: {
    provider?: string;
    sortOrder?: number;
  },
): ResourceFormRow {
  const normalized = defineResourceForm(definition);

  return {
    resource_form_id: `resource-form-${normalized.id}`,
    slug: normalized.slug,
    title: normalized.title,
    description: normalized.description ?? "",
    entity: normalized.schema.entity,
    schema_version: normalized.schemaVersion ?? 1,
    migration_key: normalized.migrationKey ?? normalized.slug,
    source_schema_url: normalized.sourceSchemaUrl ?? null,
    source_schema: normalized.schema as unknown as Record<string, unknown>,
    source_schema_provider:
      normalized.sourceSchemaProvider ?? options?.provider ?? null,
    schema: normalized.schema as unknown as Record<string, unknown>,
    default_values: normalized.defaultValues ?? {},
    submission_config:
      normalizeResourceFormSubmissionConfig(normalized.submissionConfig ?? {}).destination.type === "none" &&
      normalized.submissionConfig === undefined
        ? null
        : normalizeResourceFormSubmissionConfig(normalized.submissionConfig ?? {}),
    is_active: normalized.isActive ?? true,
    sort_order: normalized.sortOrder ?? options?.sortOrder ?? 0,
  };
}

export function createResourceFormRows(
  definitions: ResourceFormDefinition[],
  options?: { provider?: string },
): ResourceFormRow[] {
  return definitions.map((definition, index) =>
    createResourceFormRow(definition, {
      provider: options?.provider,
      sortOrder: definition.sortOrder ?? index,
    })
  );
}

export function resolveResourceFormRow(
  row: ResourceFormRow | Record<string, unknown>,
): ResolvedResourceForm | null {
  const schemaResult = validateResourceFormSchema(
    (row as ResourceFormRow).schema ?? (row as ResourceFormRow).source_schema,
  );

  if (!schemaResult.ok || !schemaResult.value) {
    return null;
  }

  const schema = schemaResult.value;
  const slug =
    typeof row.slug === "string" && row.slug.trim().length > 0
      ? normalizeSlug(row.slug)
      : typeof row.entity === "string" && row.entity.trim().length > 0
        ? normalizeSlug(row.entity)
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
    description: typeof row.description === "string" ? row.description : "",
    entity: schema.entity,
    schema,
    schemaVersion: normalizeSchemaVersion(row.schema_version) ?? 1,
    migrationKey:
      typeof row.migration_key === "string" && row.migration_key.trim().length > 0
        ? row.migration_key
        : slug,
    defaultValues: isRecord(row.default_values) ? row.default_values : {},
    isActive: row.is_active !== false,
    sortOrder:
      typeof row.sort_order === "number"
        ? row.sort_order
        : Number.MAX_SAFE_INTEGER,
    sourceSchemaProvider:
      typeof row.source_schema_provider === "string"
        ? row.source_schema_provider
        : null,
    sourceSchemaUrl:
      typeof row.source_schema_url === "string"
        ? row.source_schema_url
        : null,
    submissionConfig: normalizeResourceFormSubmissionConfig(row.submission_config),
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
