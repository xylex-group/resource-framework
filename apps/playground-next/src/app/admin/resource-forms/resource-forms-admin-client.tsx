"use client";

import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  createResourceFormRow,
  defineResourceForm,
  formatResourceFormIssues,
  playgroundFormDefinitions,
  validateResourceFormSchema,
} from "@xylex-group/resource-framework";
import { useApiClient } from "@xylex-group/resource-framework/hooks/use-api-client";
import {
  resolveResourceFormRows,
  type ResolvedPlaygroundResourceForm,
  type PlaygroundResourceFormRow,
} from "../../../lib/resource-forms";

type EditorState = {
  resource_form_id: string;
  slug: string;
  title: string;
  description: string;
  entity: string;
  schema_version: string;
  migration_key: string;
  source_schema_provider: string;
  source_schema_url: string;
  is_active: boolean;
  sort_order: string;
  schemaText: string;
  defaultValuesText: string;
};

const sectionStyle: CSSProperties = {
  backdropFilter: "blur(18px)",
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 24px 60px rgba(30, 28, 26, 0.08)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.72)",
  padding: "12px 14px",
  font: "500 0.95rem var(--font-sans)",
  color: "var(--ink)",
};

const textAreaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 220,
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  lineHeight: 1.5,
};

const buttonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--line)",
  padding: "12px 18px",
  font: "600 0.95rem var(--font-sans)",
  background: "var(--ink)",
  color: "#fff",
  cursor: "pointer",
};

function createDraftFromRow(row?: Record<string, unknown>): EditorState {
  const schema = row?.schema ?? row?.source_schema ?? {
    entity: "new_form",
    steps: {
      details: [
        {
          key: "name",
          label: "Name",
          type: "text",
          required: true,
        },
      ],
    },
  };
  const defaultValues = row?.default_values ?? {};

  return {
    resource_form_id: String(row?.resource_form_id ?? `resource-form-${Date.now()}`),
    slug: String(row?.slug ?? "new-form"),
    title: String(row?.title ?? "New form"),
    description: typeof row?.description === "string" ? row.description : "",
    entity: String(row?.entity ?? (schema as { entity?: string }).entity ?? "new_form"),
    schema_version: String(row?.schema_version ?? 1),
    migration_key: String(row?.migration_key ?? row?.slug ?? "new-form"),
    source_schema_provider: typeof row?.source_schema_provider === "string" ? row.source_schema_provider : "playground-admin",
    source_schema_url: typeof row?.source_schema_url === "string" ? row.source_schema_url : "",
    is_active: row?.is_active !== false,
    sort_order: String(row?.sort_order ?? 0),
    schemaText: JSON.stringify(schema, null, 2),
    defaultValuesText: JSON.stringify(defaultValues, null, 2),
  };
}

export function ResourceFormsAdminClient() {
  const [message, setMessage] = useState("Editing live `resource_forms` rows.");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditorState>(() => createDraftFromRow());
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    insert,
    insertMany,
    update,
    mutate,
  } = useApiClient<PlaygroundResourceFormRow>({
    table: "resource_forms",
    single: false,
    limit: 100,
  });

  const rawRows = useMemo(
    () => (Array.isArray(data) ? (data as PlaygroundResourceFormRow[]) : []),
    [data],
  );

  const forms = useMemo(
    () => resolveResourceFormRows(rawRows as Array<Record<string, unknown>>),
    [rawRows],
  );

  useEffect(() => {
    if (isCreatingNew) {
      return;
    }
    if (!forms.length) {
      setSelectedId(null);
      setDraft(createDraftFromRow());
      return;
    }

    const nextId = selectedId && forms.some((form: ResolvedPlaygroundResourceForm) => form.id === selectedId)
      ? selectedId
      : forms[0]?.id ?? null;
    setSelectedId(nextId);

    const raw = rawRows.find((row) => String(row.resource_form_id) === nextId);
    setDraft(createDraftFromRow(raw));
  }, [forms, rawRows, selectedId, isCreatingNew]);

  const validation = useMemo(() => {
    try {
      const parsedSchema = JSON.parse(draft.schemaText) as Record<string, unknown>;
      const result = validateResourceFormSchema(parsedSchema);
      return result;
    } catch (parseError) {
      return {
        ok: false,
        value: null,
        issues: [{
          path: "schema",
          code: "schema_json_invalid",
          message: parseError instanceof Error ? parseError.message : String(parseError),
        }],
      };
    }
  }, [draft.schemaText]);

  const parsedDefaults = useMemo(() => {
    try {
      return {
        ok: true,
        value: JSON.parse(draft.defaultValuesText || "{}") as Record<string, unknown>,
      };
    } catch (parseError) {
      return {
        ok: false,
        error: parseError instanceof Error ? parseError.message : String(parseError),
      };
    }
  }, [draft.defaultValuesText]);

  const canSave = validation.ok && parsedDefaults.ok;

  async function handleSeedDefinitions() {
    setMessage("Seeding canonical form definitions...");
    try {
      const rows = playgroundFormDefinitions.map((definition, index) =>
        createResourceFormRow(definition, {
          provider: "resource-framework-demo",
          sortOrder: index,
        }),
      );
      await insertMany(rows);
      await mutate();
      setMessage("Seeded canonical playground definitions.");
    } catch (seedError) {
      setMessage(seedError instanceof Error ? seedError.message : String(seedError));
    }
  }

  async function handleSave() {
    setMessage("Saving `resource_forms` row...");
    if (!validation.ok || !validation.value) {
      setMessage(formatResourceFormIssues(validation.issues));
      return;
    }
    if (!parsedDefaults.ok) {
      setMessage(parsedDefaults.error ?? "Invalid default_values JSON.");
      return;
    }

    try {
      const normalized = defineResourceForm({
        id: draft.slug || draft.resource_form_id,
        slug: draft.slug,
        title: draft.title,
        description: draft.description,
        schema: {
          ...validation.value,
          entity: draft.entity || validation.value.entity,
        },
        schemaVersion: Number(draft.schema_version || 1),
        migrationKey: draft.migration_key || draft.slug,
        defaultValues: parsedDefaults.value,
        isActive: draft.is_active,
        sortOrder: Number(draft.sort_order || 0),
        sourceSchemaProvider: draft.source_schema_provider || null,
        sourceSchemaUrl: draft.source_schema_url || null,
      });

      const row = createResourceFormRow(normalized, {
        provider: normalized.sourceSchemaProvider ?? undefined,
        sortOrder: normalized.sortOrder,
      });

      const payload = {
        ...row,
        resource_form_id: draft.resource_form_id,
      };

      const exists = rawRows.some(
        (current) => String(current.resource_form_id) === draft.resource_form_id,
      );

      if (exists) {
        await update("resource_form_id", draft.resource_form_id, payload as Record<string, unknown>);
        setMessage(`Updated ${draft.slug}.`);
      } else {
        await insert(payload as Partial<PlaygroundResourceFormRow>);
        setMessage(`Created ${draft.slug}.`);
        setIsCreatingNew(false);
      }

      await mutate();
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : String(saveError));
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", display: "grid", gap: 20 }}>
        <section style={{ ...sectionStyle, padding: 32 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <span style={{ font: "600 0.75rem var(--font-mono)", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--accent)" }}>
              Resource Forms Admin
            </span>
            <h1 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: "clamp(2.3rem, 5vw, 4rem)", lineHeight: 0.96 }}>
              Persisted form builder
            </h1>
            <p style={{ margin: 0, maxWidth: 800, color: "var(--muted)", lineHeight: 1.6 }}>
              This is the control plane for `resource_forms`: edit row metadata, author schema JSON,
              validate it through the shared contract helpers, and persist directly to Athena.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button style={buttonStyle} onClick={handleSave} disabled={!canSave}>
                Save row
              </button>
              <button
                style={{ ...buttonStyle, background: "transparent", color: "var(--ink)" }}
                onClick={() => {
                  setIsCreatingNew(true);
                  setSelectedId(null);
                  setDraft(createDraftFromRow());
                  setMessage("Creating a new draft row.");
                }}
              >
                New draft
              </button>
              <button style={{ ...buttonStyle, background: "transparent", color: "var(--ink)" }} onClick={handleSeedDefinitions}>
                Seed canonical definitions
              </button>
              <Link href="/" style={{ ...buttonStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                Back to runtime
              </Link>
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gap: 20, gridTemplateColumns: "320px minmax(0, 1fr) 320px" }}>
          <aside style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Rows</h2>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>{forms.length}</span>
            </div>
            {isLoading ? (
              <p style={{ margin: 0, color: "var(--muted)" }}>Loading rows...</p>
            ) : isError ? (
              <p style={{ margin: 0, color: "var(--warning)" }}>{error}</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {forms.map((form: ResolvedPlaygroundResourceForm) => (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setSelectedId(form.id);
                      const raw = rawRows.find((row) => String(row.resource_form_id) === form.id);
                      setDraft(createDraftFromRow(raw));
                    }}
                    style={{
                      borderRadius: 18,
                      border: form.id === selectedId ? "1px solid var(--accent)" : "1px solid var(--line)",
                      background: "rgba(255,255,255,0.45)",
                      padding: 14,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <strong>{form.title}</strong>
                      <span style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase" }}>{form.slug}</span>
                    </div>
                    <p style={{ marginBottom: 0, color: "var(--muted)", lineHeight: 1.5 }}>
                      {form.description || "No description stored on this row."}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section style={{ ...sectionStyle, display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <label>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Row id</div>
                <input value={draft.resource_form_id} onChange={(e) => setDraft((current) => ({ ...current, resource_form_id: e.target.value }))} style={inputStyle} />
              </label>
              <label>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Slug</div>
                <input value={draft.slug} onChange={(e) => setDraft((current) => ({ ...current, slug: e.target.value }))} style={inputStyle} />
              </label>
              <label>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Title</div>
                <input value={draft.title} onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))} style={inputStyle} />
              </label>
              <label>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Entity</div>
                <input value={draft.entity} onChange={(e) => setDraft((current) => ({ ...current, entity: e.target.value }))} style={inputStyle} />
              </label>
              <label>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Schema version</div>
                <input value={draft.schema_version} onChange={(e) => setDraft((current) => ({ ...current, schema_version: e.target.value }))} style={inputStyle} />
              </label>
              <label>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Migration key</div>
                <input value={draft.migration_key} onChange={(e) => setDraft((current) => ({ ...current, migration_key: e.target.value }))} style={inputStyle} />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Description</div>
                <input value={draft.description} onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))} style={inputStyle} />
              </label>
              <label>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Source provider</div>
                <input value={draft.source_schema_provider} onChange={(e) => setDraft((current) => ({ ...current, source_schema_provider: e.target.value }))} style={inputStyle} />
              </label>
              <label>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Source schema URL</div>
                <input value={draft.source_schema_url} onChange={(e) => setDraft((current) => ({ ...current, source_schema_url: e.target.value }))} style={inputStyle} />
              </label>
              <label>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Sort order</div>
                <input value={draft.sort_order} onChange={(e) => setDraft((current) => ({ ...current, sort_order: e.target.value }))} style={inputStyle} />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
                <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft((current) => ({ ...current, is_active: e.target.checked }))} />
                <span style={{ fontSize: 14 }}>Active row</span>
              </label>
            </div>

            <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <label>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Schema JSON</div>
                <textarea value={draft.schemaText} onChange={(e) => setDraft((current) => ({ ...current, schemaText: e.target.value }))} style={textAreaStyle} />
              </label>
              <label>
                <div style={{ marginBottom: 6, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Default values JSON</div>
                <textarea value={draft.defaultValuesText} onChange={(e) => setDraft((current) => ({ ...current, defaultValuesText: e.target.value }))} style={textAreaStyle} />
              </label>
            </div>
          </section>

          <aside style={{ ...sectionStyle, display: "grid", gap: 16 }}>
            <section>
              <h2 style={{ marginTop: 0 }}>Validation</h2>
              <p style={{ color: validation.ok ? "#0f766e" : "#b91c1c", lineHeight: 1.5 }}>
                {validation.ok ? "Schema valid." : formatResourceFormIssues(validation.issues)}
              </p>
              {!parsedDefaults.ok && (
                <p style={{ color: "#b91c1c", lineHeight: 1.5 }}>
                  default_values JSON invalid: {parsedDefaults.error}
                </p>
              )}
            </section>
            <section>
              <h2 style={{ marginTop: 0 }}>Operational notes</h2>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7 }}>
                <li>Validation uses the same shared contract as runtime rendering.</li>
                <li>Save updates the live `resource_forms` row by `resource_form_id`.</li>
                <li>`migration_key` + `schema_version` define the explicit migration lineage for each form family.</li>
                <li>Seed creates canonical demo definitions through the builder helpers.</li>
              </ul>
            </section>
            <section>
              <h2 style={{ marginTop: 0 }}>Status</h2>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
