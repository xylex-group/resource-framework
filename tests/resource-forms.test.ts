import { describe, expect, it } from "vitest";

import {
  createResourceFormRow,
  defineResourceForm,
  defineResourceFormSchema,
  formatResourceFormIssues,
  getOrderedResourceFormSteps,
  getRequiredResourceFormFieldKeys,
  parseResourceFormSchema,
  resolveResourceFormRows,
  validateResourceFormSchema,
} from "@/utils/resource-forms";

describe("resource form tooling", () => {
  const validSchema = defineResourceFormSchema({
    entity: "customer_profile",
    steps: {
      details: [
        {
          key: "first_name",
          label: "First name",
          type: "text",
          required: true,
        },
      ],
      preferences: [
        {
          key: "contact_channel",
          label: "Contact channel",
          type: "card_select",
          options: [
            { title: "Email", value: "email" },
            { title: "Phone", value: "phone" },
          ],
        },
      ],
    },
    step_order: ["preferences", "details"],
  });

  it("validates and orders schema steps deterministically", () => {
    const ordered = getOrderedResourceFormSteps(validSchema);
    expect(ordered.map(([stepKey]: [string, unknown]) => stepKey)).toEqual([
      "preferences",
      "details",
    ]);
    expect(getRequiredResourceFormFieldKeys(validSchema)).toEqual(["first_name"]);
  });

  it("builds rows from definitions and resolves them back", () => {
    const definition = defineResourceForm({
      id: "customer-intake",
      title: "Customer intake",
      description: "Demo intake flow",
      schema: validSchema,
      schemaVersion: 3,
      migrationKey: "customer-intake",
      defaultValues: {
        first_name: "Taylor",
      },
      sourceSchemaProvider: "vitest",
    });

    const row = createResourceFormRow(definition, { sortOrder: 3 });
    const resolved = resolveResourceFormRows([row]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.slug).toBe("customer-intake");
    expect(resolved[0]?.defaultValues).toEqual({ first_name: "Taylor" });
    expect(resolved[0]?.sortOrder).toBe(3);
    expect(resolved[0]?.schemaVersion).toBe(3);
    expect(resolved[0]?.migrationKey).toBe("customer-intake");
    expect(resolved[0]?.sourceSchemaProvider).toBe("vitest");
  });

  it("defaults version lineage when version fields are omitted", () => {
    const row = createResourceFormRow({
      id: "versionless-form",
      title: "Versionless form",
      schema: validSchema,
    });
    const resolved = resolveResourceFormRows([row]);

    expect(row.schema_version).toBe(1);
    expect(row.migration_key).toBe("versionless-form");
    expect(resolved[0]?.schemaVersion).toBe(1);
    expect(resolved[0]?.migrationKey).toBe("versionless-form");
  });

  it("reports meaningful validation issues for malformed schemas", () => {
    const invalid = validateResourceFormSchema({
      entity: "broken_form",
      steps: {
        empty_step: [],
        invalid_field: [
          {
            key: "",
            label: "",
            type: "card_select",
          },
        ],
      },
      step_order: ["missing_step"],
    });

    expect(invalid.ok).toBe(false);
    expect(invalid.issues.some((issue: { code: string }) => issue.code === "step_fields_empty")).toBe(true);
    expect(invalid.issues.some((issue: { code: string }) => issue.code === "field_options_missing")).toBe(true);
    expect(invalid.issues.some((issue: { code: string }) => issue.code === "step_order_unknown_step")).toBe(true);
    expect(formatResourceFormIssues(invalid.issues)).toContain("missing_step");
    expect(parseResourceFormSchema({ entity: "broken_form", steps: { bad: [] } })).toBeNull();
  });
});
