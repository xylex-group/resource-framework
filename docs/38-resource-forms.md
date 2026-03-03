# Resource Forms

`resource_forms` is the package-level contract for persisted, metadata-driven form experiences.

A row in `resource_forms` is treated as an authorable runtime artifact:

```ts
{
  resource_form_id: string;
  slug: string;
  title?: string;
  description?: string;
  entity: string;
  schema_version?: number | null;
  migration_key?: string | null;
  source_schema_url?: string | null;
  source_schema?: Record<string, unknown>;
  source_schema_provider?: string | null;
  schema?: Record<string, unknown>;
  default_values?: Record<string, unknown> | null;
  is_active?: boolean;
  sort_order?: number | null;
}
```

## Runtime model

The framework normalizes rows into `ResolvedResourceForm`:

- `id`
- `slug`
- `title`
- `description`
- `entity`
- `schema`
- `schemaVersion`
- `migrationKey`
- `defaultValues`
- `isActive`
- `sortOrder`
- `sourceSchemaProvider`
- `sourceSchemaUrl`

Use these helpers instead of parsing rows ad hoc:

- `validateResourceFormSchema()`
- `parseResourceFormSchema()`
- `resolveResourceFormRow()`
- `resolveResourceFormRows()`
- `getOrderedResourceFormSteps()`
- `getResourceFormFieldKeys()`
- `getRequiredResourceFormFieldKeys()`
- `planResourceFormSubmissionMigration()`
- `migrateResourceFormSubmission()`
- `migrateResolvedResourceFormSubmission()`

## Validation rules

The shared validator rejects malformed form contracts early.

It checks:

- `schema.entity` is present
- `schema.steps` exists and contains at least one step
- each step contains at least one field
- each field has `key`, `label`, and valid `type`
- `card_select` and `plan_select` fields declare `options`
- options contain values and titles/labels
- duplicate field keys within a step are rejected
- `step_order` only references real steps

Use `formatResourceFormIssues()` to surface validation errors in CI, tooling, or admin UIs.

## Authoring flow

Recommended flow:

1. Build a schema with `defineResourceFormSchema()`.
2. Wrap it in `defineResourceForm()`.
3. Convert definitions into persisted rows via `createResourceFormRow()` or `createResourceFormRows()`.
4. Persist those rows into `resource_forms`.
5. Read rows back and resolve them with `resolveResourceFormRows()`.
6. Render the resolved form with `EntityFormV2`.

Use `migration_key` as the stable form family identifier and `schema_version` as the monotonic version within that family. That keeps backend migration code explicit when builder changes alter payload shape or required fields.

## Submission migrations

Use the migration helpers when a persisted form version no longer matches the payload contract expected by a downstream API or storage layer.

Recommended pattern:

1. Register adjacent upgrade/downgrade steps with `defineResourceFormSubmissionMigrationRegistry()`.
2. Resolve the active form row with `resolveResourceFormRows()`.
3. Before persistence, call `migrateResolvedResourceFormSubmission({ form, toVersion, payload, registry })`.
4. Persist the transformed payload alongside the original form metadata if auditability matters.

The migration planner is deterministic: it walks one version at a time and throws if any edge in the path is missing.

## Example

```ts
import {
  createResourceFormRow,
  defineResourceForm,
  defineResourceFormSchema,
} from "@xylex-group/resource-framework";

const contactSchema = defineResourceFormSchema({
  entity: "contact",
  steps: {
    details: [
      {
        key: "first_name",
        label: "First name",
        type: "text",
        required: true,
      },
    ],
  },
});

const definition = defineResourceForm({
  id: "contact-intake",
  title: "Contact intake",
  schema: contactSchema,
  schemaVersion: 2,
  migrationKey: "contact-intake",
  defaultValues: {
    first_name: "Alex",
  },
  sourceSchemaProvider: "internal-seed",
});

const row = createResourceFormRow(definition);
```

## Renderer relationship

`EntityFormV2` is the renderer. It expects a validated `ResourceFormSchema` plus `values` and `onChange`/`onSubmit` handlers.

Do not let application pages re-implement step ordering or row normalization. Keep those concerns in the shared `resource-forms` utilities.

## Playground usage

Both demo surfaces now use the same package-level flow:

- author definitions in `demo/playground-forms.ts`
- derive rows with `createResourceFormRows()`
- resolve persisted rows via `resolveResourceFormRows()`
- manage selected form + values with `useResourceFormRuntime()`
- render with `EntityFormV2`
