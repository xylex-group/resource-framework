"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { EntityFormV2 } from "@xylex-group/resource-framework";
import { useApiClient } from "@xylex-group/resource-framework/hooks/use-api-client";
import {
  playgroundResourceFormRows,
  resolveResourceFormRows,
  type PlaygroundResourceFormRow,
} from "@/lib/resource-forms";

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
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [message, setMessage] = useState("Reading from `resource_forms`.");
  const [submittedPayload, setSubmittedPayload] = useState("");

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

  useEffect(() => {
    if (!forms.length) {
      setSelectedFormId(null);
      return;
    }

    setSelectedFormId((current) =>
      current && forms.some((form) => form.id === current)
        ? current
        : forms[0]!.id,
    );
  }, [forms]);

  const selected = useMemo(
    () => forms.find((form) => form.id === selectedFormId) ?? forms[0] ?? null,
    [forms, selectedFormId],
  );

  useEffect(() => {
    setValues(selected?.defaultValues ? { ...selected.defaultValues } : {});
    setSubmittedPayload("");
  }, [selected]);

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
              This page renders fully from the `resource_forms` table. Each row stores
              display metadata plus a persisted `ResourceFormSchema`, which is then fed
              directly into `EntityFormV2`.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button style={buttonStyle} onClick={handleSeedForms}>
                Seed demo forms
              </button>
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
                {forms.map((form) => (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => setSelectedFormId(form.id)}
                    style={{
                      borderRadius: 18,
                      border: form.id === selected?.id
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
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...sectionStyle, background: "rgba(255,255,255,0.58)" }}>
            {selected ? (
              <>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                    Active form
                  </div>
                  <h2 style={{ marginBottom: 6 }}>{selected.title}</h2>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    Entity: {selected.entity}
                  </p>
                </div>
                <EntityFormV2
                  schema={selected.schema}
                  values={values}
                  onChange={(key, value) => {
                    setValues((current) => ({
                      ...current,
                      [key]: value,
                    }));
                  }}
                  onSubmit={() => {
                    setMessage(`Captured submission for ${selected.slug}.`);
                    setSubmittedPayload(JSON.stringify(values, null, 2));
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
  schema,
  default_values,
  is_active,
  sort_order
}`}
              </pre>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>Submission payload</h2>
              <p style={{ color: "var(--muted)" }}>{message}</p>
              <pre style={{ margin: 0, maxHeight: 420, overflow: "auto", fontSize: 12 }}>
                {submittedPayload || JSON.stringify(values, null, 2)}
              </pre>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
