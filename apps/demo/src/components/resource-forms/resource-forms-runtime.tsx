"use client";

import { useEffect, useMemo, useState } from "react";
import { EntityFormV2 } from "@rf/components/form-v2/entity-form_v2";
import { fetchData } from "@/lib/actions/data";
import {
  resolveResourceFormRows,
  type DemoResourceFormRow,
} from "@/lib/resource-forms";
import { cn } from "@/lib/utils";

type ResourceFormsRuntimeProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ResourceFormsRuntime({
  eyebrow,
  title,
  description,
}: ResourceFormsRuntimeProps) {
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [submittedPayload, setSubmittedPayload] = useState<string>("");
  const [rows, setRows] = useState<DemoResourceFormRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError("");

      const response = await fetchData({
        table_name: "resource_forms",
        limit: 50,
      });

      if (!active) return;

      if (response.error) {
        setError(response.error);
        setRows([]);
      } else {
        setRows(
          (Array.isArray(response.data) ? response.data : []) as DemoResourceFormRow[],
        );
      }

      setIsLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const forms = useMemo(
    () => resolveResourceFormRows(rows as Array<Record<string, unknown>>),
    [rows],
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
    setSubmitMessage("");
    setSubmittedPayload("");
  }, [selected]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.45em] text-slate-500">
            {eyebrow}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-3xl text-slate-400">{description}</p>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            Rendering directly from the `resource_forms` table. Each row carries the
            persisted `schema`, `default_values`, and display metadata for `EntityFormV2`.
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr),360px]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Resource forms</h2>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {forms.length}
              </span>
            </div>

            {isLoading ? (
              <p className="text-sm text-slate-400">Loading form rows...</p>
            ) : error ? (
              <p className="text-sm text-rose-400">{error}</p>
            ) : forms.length === 0 ? (
              <p className="text-sm text-slate-400">
                No active rows were returned from `resource_forms`.
              </p>
            ) : (
              <div className="space-y-2">
                {forms.map((form) => (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => setSelectedFormId(form.id)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left transition",
                      form.id === selected?.id
                        ? "border-emerald-400 bg-slate-950"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-600",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{form.title}</span>
                      <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                        {form.slug}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      {form.description || "No description stored on this row."}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/40">
            {selected ? (
              <>
                <div className="mb-5 space-y-1">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                    Live form runtime
                  </p>
                  <h2 className="text-2xl font-semibold">{selected.title}</h2>
                  <p className="text-sm text-slate-400">
                    Entity: <span className="text-slate-200">{selected.entity}</span>
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
                    setSubmitMessage(`Captured submission for ${selected.slug}.`);
                    setSubmittedPayload(JSON.stringify(values, null, 2));
                  }}
                />
              </>
            ) : (
              <p className="text-sm text-slate-400">Select a resource form to begin.</p>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold">Stored row spec</h2>
              <p className="mt-2 text-sm text-slate-400">
                The table row is the contract: catalog metadata plus a persisted
                `ResourceFormSchema`.
              </p>
              <pre className="mt-4 overflow-auto rounded-xl bg-slate-950/80 p-3 text-xs text-slate-300">
{`{
  resource_form_id: uuid/text,
  slug: string,
  title: string,
  description: string,
  entity: string,
  schema: ResourceFormSchema,
  default_values: Record<string, unknown>,
  is_active: boolean,
  sort_order: number
}`}
              </pre>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold">Submission preview</h2>
              <p className="mt-2 text-sm text-slate-400">
                {submitMessage || "Submit a form to inspect the captured payload."}
              </p>
              <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl bg-slate-950/80 p-3 text-xs text-slate-300">
                {submittedPayload || JSON.stringify(values, null, 2)}
              </pre>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
