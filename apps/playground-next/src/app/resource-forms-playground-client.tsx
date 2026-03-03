"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  EntityFormV2,
  formatResourceFormIssues,
  getOrderedResourceFormSteps,
  getRequiredResourceFormFieldKeys,
  listResourceFormSubmissionVersions,
  migrateResolvedResourceFormSubmission,
  useResourceFormRuntime,
  validateResourceFormSchema,
} from "@xylex-group/resource-framework";
import { useApiClient } from "@xylex-group/resource-framework/hooks/use-api-client";
import {
  playgroundResourceFormRows,
  playgroundResourceFormSubmissionMigrations,
  resolveResourceFormRows,
  type PlaygroundResourceFormRow,
} from "../lib/resource-forms";

const sectionStyle: CSSProperties = {
  backdropFilter: "blur(18px)",
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 24px 60px rgba(30, 28, 26, 0.08)",
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

export function ResourceFormsPlaygroundClient() {
  const [message, setMessage] = useState("Reading from `resource_forms`.");
  const [submittedValues, setSubmittedValues] = useState<Record<string, unknown> | null>(null);
  const [targetVersion, setTargetVersion] = useState<number>(1);

  const {
    data,
    isLoading,
    isError,
    error,
    insertMany,
    mutate,
  } = useApiClient<PlaygroundResourceFormRow>({
    table: "resource_forms",
    single: false,
    limit: 50,
  });

  const forms = useMemo(
    () => resolveResourceFormRows(Array.isArray(data) ? data : []),
    [data],
  );

  const {
    selectedForm,
    selectedFormId,
    setSelectedFormId,
    values,
    updateValue,
    resetValues,
  } = useResourceFormRuntime(forms);

  const selectedStepEntries = useMemo(
    () => (selectedForm ? getOrderedResourceFormSteps(selectedForm.schema) : []),
    [selectedForm],
  );
  const selectedRequiredFields = useMemo(
    () => selectedForm ? getRequiredResourceFormFieldKeys(selectedForm.schema) : [],
    [selectedForm],
  );
  const selectedValidation = useMemo(
    () => selectedForm ? validateResourceFormSchema(selectedForm.schema) : { ok: true, value: null, issues: [] },
    [selectedForm],
  );
  const availableVersions = useMemo(
    () => selectedForm
      ? listResourceFormSubmissionVersions({
          registry: playgroundResourceFormSubmissionMigrations,
          migrationKey: selectedForm.migrationKey,
          includeVersions: [selectedForm.schemaVersion],
        })
      : [],
    [selectedForm],
  );
  const payloadSource = submittedValues ?? values;
  const migratedPayloadResult = useMemo(() => {
    if (!selectedForm) {
      return { ok: true, payload: {}, error: "" };
    }

    try {
      return {
        ok: true,
        payload: migrateResolvedResourceFormSubmission({
          registry: playgroundResourceFormSubmissionMigrations,
          form: selectedForm,
          toVersion: targetVersion,
          payload: payloadSource,
        }),
        error: "",
      };
    } catch (migrationError) {
      return {
        ok: false,
        payload: null,
        error: migrationError instanceof Error ? migrationError.message : String(migrationError),
      };
    }
  }, [payloadSource, selectedForm, targetVersion]);

  useEffect(() => {
    setSubmittedValues(null);
    if (!selectedForm) {
      setTargetVersion(1);
      return;
    }

    const highestVersion = availableVersions[availableVersions.length - 1] ?? selectedForm.schemaVersion;
    setTargetVersion(highestVersion);
  }, [availableVersions, selectedForm]);

  async function handleSeedForms() {
    setMessage("Seeding demo rows into `resource_forms`...");
    try {
      await insertMany(
        playgroundResourceFormRows.map((row) => ({
          ...row,
        })),
      );
      await mutate();
      setMessage("Seeded demo `resource_forms` rows.");
    } catch (seedError) {
      setMessage(
        seedError instanceof Error ? seedError.message : String(seedError),
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px 80px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <section style={{ ...sectionStyle, padding: 32 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <span
              style={{
                font: "600 0.75rem var(--font-mono)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--accent)",
              }}
            >
              Next.js Playground
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2.4rem, 5vw, 4.4rem)",
                lineHeight: 0.96,
              }}
            >
              Resource forms runtime
            </h1>
            <p style={{ margin: 0, maxWidth: 760, color: "var(--muted)", lineHeight: 1.6 }}>
              The authoring workflow is now explicit: definitions are built with shared
              helpers, converted into deterministic `resource_forms` rows, validated,
              then rendered into `EntityFormV2` at runtime.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button style={buttonStyle} onClick={handleSeedForms}>
                Seed demo forms
              </button>
              <button style={{ ...buttonStyle, background: "transparent", color: "var(--ink)" }} onClick={resetValues}>
                Reset active defaults
              </button>
              <Link href="/admin/resource-forms" style={{ ...buttonStyle, background: "transparent", color: "var(--ink)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                Open admin builder
              </Link>
              <Link href="/bench" style={{ ...buttonStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                Open Athena bench
              </Link>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "minmax(280px, 320px) minmax(0, 1fr) minmax(280px, 360px)",
          }}
        >
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>resource_forms</h2>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>{forms.length}</span>
            </div>
            {isLoading ? (
              <p style={{ margin: 0, color: "var(--muted)" }}>Loading rows...</p>
            ) : isError ? (
              <p style={{ margin: 0, color: "var(--warning)" }}>{error}</p>
            ) : forms.length === 0 ? (
              <p style={{ margin: 0, color: "var(--muted)" }}>
                No active rows found. Seed the demo forms or point the playground at an
                Athena dataset that already contains `resource_forms`.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {forms.map((form) => {
                  const stepCount = getOrderedResourceFormSteps(form.schema).length;
                  const requiredCount = getRequiredResourceFormFieldKeys(form.schema).length;
                  return (
                    <button
                      key={form.id}
                      type="button"
                      onClick={() => setSelectedFormId(form.id)}
                      style={{
                        borderRadius: 18,
                        border: form.id === selectedFormId
                          ? "1px solid var(--accent)"
                          : "1px solid var(--line)",
                        background: "rgba(255,255,255,0.45)",
                        padding: 14,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <strong>{form.title}</strong>
                        <span style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase" }}>
                          {form.slug}
                        </span>
                      </div>
                      <p style={{ marginBottom: 0, color: "var(--muted)", lineHeight: 1.5 }}>
                        {form.description || "No description stored on this row."}
                      </p>
                      <div style={{ marginTop: 10, display: "flex", gap: 10, color: "var(--muted)", fontSize: 12 }}>
                        <span>{stepCount} steps</span>
                        <span>{requiredCount} required</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ ...sectionStyle, background: "rgba(255,255,255,0.58)" }}>
            {selectedForm ? (
              <>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                    Active form
                  </div>
                  <h2 style={{ marginBottom: 6 }}>{selectedForm.title}</h2>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    Entity: {selectedForm.entity}
                  </p>
                  <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                    Migration lineage: {selectedForm.migrationKey} v{selectedForm.schemaVersion}
                  </p>
                </div>
                <EntityFormV2
                  schema={selectedForm.schema}
                  values={values}
                  onChange={updateValue}
                  onSubmit={() => {
                    setMessage(`Captured submission for ${selectedForm.slug} and transformed it to v${targetVersion}.`);
                    setSubmittedValues({ ...values });
                  }}
                />
              </>
            ) : (
              <p style={{ margin: 0, color: "var(--muted)" }}>
                Select a row from `resource_forms` to render it.
              </p>
            )}
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>Row contract</h2>
              <pre style={{ margin: 0, overflow: "auto", fontSize: 12 }}>
{`{
  resource_form_id,
  slug,
  title,
  description,
  entity,
  schema_version,
  migration_key,
  source_schema_url,
  source_schema_provider,
  schema,
  default_values,
  is_active,
  sort_order
}`}
              </pre>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>Contract analysis</h2>
              {!selectedForm ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  Select a form to inspect its ordered steps, required fields, and validation state.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                      Validation
                    </div>
                    <p style={{ marginBottom: 0, color: selectedValidation.ok ? "#0f766e" : "#b91c1c" }}>
                      {selectedValidation.ok ? "Schema valid" : formatResourceFormIssues(selectedValidation.issues)}
                    </p>
                  </div>
                  <div>
                    <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                      Ordered steps
                    </div>
                    <ol style={{ marginBottom: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7 }}>
                      {selectedStepEntries.map(([stepKey, fields]) => (
                        <li key={stepKey}>{stepKey} ({fields.length} fields)</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                      Required fields
                    </div>
                    <p style={{ marginBottom: 0, color: "var(--muted)" }}>
                      {selectedRequiredFields.length > 0
                        ? selectedRequiredFields.join(", ")
                        : "No required fields."}
                    </p>
                  </div>
                  <div>
                    <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                      Migration
                    </div>
                    <p style={{ marginBottom: 0, color: "var(--muted)" }}>
                      {selectedForm.migrationKey} v{selectedForm.schemaVersion}
                      {availableVersions.length > 1
                        ? ` -> available targets: ${availableVersions.join(", ")}`
                        : " -> no alternate targets registered"}
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <h2 style={{ margin: 0 }}>Submission payloads</h2>
                {selectedForm ? (
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 12 }}>
                    Target version
                    <select
                      value={String(targetVersion)}
                      onChange={(event) => setTargetVersion(Number(event.target.value))}
                      style={{ borderRadius: 999, border: "1px solid var(--line)", padding: "6px 10px", background: "#fff" }}
                    >
                      {availableVersions.map((version) => (
                        <option key={version} value={version}>
                          v{version}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <p style={{ color: "var(--muted)" }}>{message}</p>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>
                    Raw form values
                  </div>
                  <pre style={{ margin: 0, maxHeight: 220, overflow: "auto", fontSize: 12 }}>
                    {JSON.stringify(payloadSource, null, 2)}
                  </pre>
                </div>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>
                    Migrated payload {selectedForm ? `(target v${targetVersion})` : ""}
                  </div>
                  {migratedPayloadResult.ok ? (
                    <pre style={{ margin: 0, maxHeight: 220, overflow: "auto", fontSize: 12 }}>
                      {JSON.stringify(migratedPayloadResult.payload, null, 2)}
                    </pre>
                  ) : (
                    <p style={{ margin: 0, color: "#b91c1c", lineHeight: 1.6 }}>
                      {migratedPayloadResult.error}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
