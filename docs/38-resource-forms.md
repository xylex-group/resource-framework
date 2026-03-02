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
