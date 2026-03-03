"use client";

import { useEffect, useMemo, useState } from "react";
import { EntityFormV2 } from "@rf/components/form-v2/entity-form_v2";
import {
  listResourceFormSubmissionVersions,
  migrateResolvedResourceFormSubmission,
} from "@rf/utils/resource-form-migrations";
import {
  formatResourceFormIssues,
  getOrderedResourceFormSteps,
  getRequiredResourceFormFieldKeys,
  validateResourceFormSchema,
} from "@rf/utils/resource-forms";
import { useResourceFormRuntime } from "@rf/hooks/use-resource-form-runtime";
import { fetchData } from "@/lib/actions/data";
import {
  playgroundResourceFormSubmissionMigrations,
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
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [submittedValues, setSubmittedValues] = useState<Record<string, unknown> | null>(null);
  const [targetVersion, setTargetVersion] = useState<number>(1);
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

  const {
    selectedForm,
    selectedFormId,
    setSelectedFormId,
    values,
    updateValue,
    resetValues,
  } = useResourceFormRuntime(forms);

  useEffect(() => {
    setSubmitMessage("");
    setSubmittedValues(null);
  }, [selectedForm?.id]);

  const selectedStepEntries = useMemo(
    () => (selectedForm ? getOrderedResourceFormSteps(selectedForm.schema) : []),
    [selectedForm],
  );
  const selectedRequiredFields = useMemo(
    () =>
      selectedForm ? getRequiredResourceFormFieldKeys(selectedForm.schema) : [],
    [selectedForm],
  );
  const selectedValidation = useMemo(
    () =>
      selectedForm
        ? validateResourceFormSchema(selectedForm.schema)
        : { ok: true, value: null, issues: [] },
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
    if (!selectedForm) {
      setTargetVersion(1);
      return;
    }

    const highestVersion =
      availableVersions[availableVersions.length - 1] ?? selectedForm.schemaVersion;
    setTargetVersion(highestVersion);
  }, [availableVersions, selectedForm]);

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
            `resource_forms` is now treated as a first-class contract. Rows are
            validated, normalized, ordered, and then rendered through the shared
            `EntityFormV2` runtime.
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
                {forms.map((form) => {
                  const stepCount = getOrderedResourceFormSteps(form.schema).length;
                  const requiredCount = getRequiredResourceFormFieldKeys(form.schema).length;
                  return (
                    <button
                      key={form.id}
                      type="button"
                      onClick={() => setSelectedFormId(form.id)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-3 text-left transition",
                        form.id === selectedFormId
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
                      <div className="mt-3 flex gap-3 text-[11px] text-slate-500">
                        <span>{stepCount} steps</span>
                        <span>{requiredCount} required</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/40">
            {selectedForm ? (
              <>
                <div className="mb-5 space-y-1">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                    Live form runtime
                  </p>
                  <h2 className="text-2xl font-semibold">{selectedForm.title}</h2>
                  <p className="text-sm text-slate-400">
                    Entity: <span className="text-slate-200">{selectedForm.entity}</span>
                  </p>
                  <p className="text-sm text-slate-400">
                    Migration lineage: <span className="text-slate-200">{selectedForm.migrationKey} v{selectedForm.schemaVersion}</span>
                  </p>
                </div>
                <EntityFormV2
                  schema={selectedForm.schema}
                  values={values}
                  onChange={updateValue}
                  onSubmit={() => {
                    setSubmitMessage(`Captured submission for ${selectedForm.slug} and transformed it to v${targetVersion}.`);
                    setSubmittedValues({ ...values });
                  }}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={resetValues}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-slate-500"
                  >
                    Reset to defaults
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">Select a resource form to begin.</p>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold">Contract snapshot</h2>
              <p className="mt-2 text-sm text-slate-400">
                The row contract now includes authoring metadata, schema source lineage,
                and deterministic ordering helpers.
              </p>
              <pre className="mt-4 overflow-auto rounded-xl bg-slate-950/80 p-3 text-xs text-slate-300">
{`{
  resource_form_id: uuid/text,
  slug: string,
  title: string,
  description: string,
  entity: string,
  schema_version: number,
  migration_key: string,
  source_schema_url?: string | null,
  source_schema_provider?: string | null,
  schema: ResourceFormSchema,
  default_values: Record<string, unknown>,
  is_active: boolean,
  sort_order: number
}`}
              </pre>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold">Selected form analysis</h2>
              {!selectedForm ? (
                <p className="mt-2 text-sm text-slate-400">Pick a form to inspect its contract details.</p>
              ) : (
                <div className="mt-2 space-y-3 text-sm text-slate-300">
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Validation</div>
                    <p className={selectedValidation.ok ? "text-emerald-300" : "text-rose-300"}>
                      {selectedValidation.ok ? "Schema valid" : formatResourceFormIssues(selectedValidation.issues)}
                    </p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Step order</div>
                    <ol className="mt-1 list-decimal space-y-1 pl-5 text-slate-400">
                      {selectedStepEntries.map(([stepKey, fields]) => (
                        <li key={stepKey}>
                          {stepKey} ({fields.length} fields)
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Required fields</div>
                    <p className="mt-1 text-slate-400">
                      {selectedRequiredFields.length > 0
                        ? selectedRequiredFields.join(", ")
                        : "No required fields."}
                    </p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Migration</div>
                    <p className="mt-1 text-slate-400">
                      {selectedForm.migrationKey} v{selectedForm.schemaVersion}
                      {availableVersions.length > 1
                        ? ` -> available targets: ${availableVersions.join(", ")}`
                        : " -> no alternate targets registered"}
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Submission preview</h2>
                {selectedForm ? (
                  <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Target
                    <select
                      value={String(targetVersion)}
                      onChange={(event) => setTargetVersion(Number(event.target.value))}
                      className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
                    >
                      {availableVersions.map((version: number) => (
                        <option key={version} value={version}>
                          v{version}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {submitMessage || "Submit a form to inspect the captured payload."}
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500">Raw form values</div>
                  <pre className="max-h-[220px] overflow-auto rounded-xl bg-slate-950/80 p-3 text-xs text-slate-300">
                    {JSON.stringify(payloadSource, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                    Migrated payload {selectedForm ? `(target v${targetVersion})` : ""}
                  </div>
                  {migratedPayloadResult.ok ? (
                    <pre className="max-h-[220px] overflow-auto rounded-xl bg-slate-950/80 p-3 text-xs text-slate-300">
                      {JSON.stringify(migratedPayloadResult.payload, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-rose-400">{migratedPayloadResult.error}</p>
                  )}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
