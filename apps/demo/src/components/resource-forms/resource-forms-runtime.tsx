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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, RotateCcw, FileText } from "lucide-react";

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
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <header className="space-y-3">
          <Badge variant="outline">{eyebrow}</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-3xl text-muted-foreground">{description}</p>
          <Card size="sm">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <code className="text-foreground">resource_forms</code> is now
                treated as a first-class contract. Rows are validated,
                normalized, ordered, and then rendered through the shared{" "}
                <code className="text-foreground">EntityFormV2</code> runtime.
              </p>
            </CardContent>
          </Card>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)] xl:grid-cols-[300px,minmax(0,1fr),340px]">
          {/* Sidebar: Form selector */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resource forms</CardTitle>
                <Badge variant="secondary">{forms.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading form rows&hellip;</p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : forms.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active rows were returned from <code>resource_forms</code>.
                </p>
              ) : (
                <div className="space-y-2">
                  {forms.map((form) => {
                    const stepCount = getOrderedResourceFormSteps(form.schema).length;
                    const requiredCount = getRequiredResourceFormFieldKeys(form.schema).length;
                    const isSelected = form.id === selectedFormId;
                    return (
                      <button
                        key={form.id}
                        type="button"
                        onClick={() => setSelectedFormId(form.id)}
                        className={cn(
                          "w-full rounded-lg border p-3 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-accent/50",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{form.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {form.slug}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {form.description || "No description stored on this row."}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {stepCount} steps
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {requiredCount} required
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Center: Live form */}
          <Card>
            <CardContent>
              {selectedForm ? (
                <>
                  <div className="mb-5 space-y-2">
                    <Badge variant="outline">Live form runtime</Badge>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {selectedForm.title}
                    </h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        Entity:{" "}
                        <span className="text-foreground">{selectedForm.entity}</span>
                      </span>
                      <span>
                        Migration:{" "}
                        <span className="text-foreground">
                          {selectedForm.migrationKey} v{selectedForm.schemaVersion}
                        </span>
                      </span>
                    </div>
                  </div>
                  <Separator className="mb-5" />
                  <EntityFormV2
                    schema={selectedForm.schema}
                    values={values}
                    onChange={updateValue}
                    onSubmit={() => {
                      setSubmitMessage(
                        `Captured submission for ${selectedForm.slug} and transformed it to v${targetVersion}.`,
                      );
                      setSubmittedValues({ ...values });
                    }}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={resetValues}>
                      <RotateCcw data-icon="inline-start" />
                      Reset to defaults
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FileText className="mb-3 size-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Select a resource form to begin.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right sidebar: Analysis panels */}
          <div className="space-y-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Contract snapshot</CardTitle>
                <CardDescription>
                  The row contract now includes authoring metadata, schema source
                  lineage, and deterministic ordering helpers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <pre className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
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
                </ScrollArea>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Selected form analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedForm ? (
                  <p className="text-sm text-muted-foreground">
                    Pick a form to inspect its contract details.
                  </p>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Validation
                      </p>
                      <div className="flex items-center gap-1.5">
                        {selectedValidation.ok ? (
                          <>
                            <CheckCircle2 className="size-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Schema valid</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3.5 text-destructive" />
                            <span className="text-destructive">
                              {formatResourceFormIssues(selectedValidation.issues)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Step order
                      </p>
                      <ol className="list-decimal space-y-0.5 pl-5 text-muted-foreground">
                        {selectedStepEntries.map(([stepKey, fields]) => (
                          <li key={stepKey}>
                            {stepKey}{" "}
                            <Badge variant="secondary" className="ml-1 text-[10px]">
                              {fields.length} fields
                            </Badge>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Required fields
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedRequiredFields.length > 0 ? (
                          selectedRequiredFields.map((field) => (
                            <Badge key={field} variant="outline" className="text-[10px]">
                              {field}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No required fields.</span>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Migration
                      </p>
                      <p className="text-muted-foreground">
                        {selectedForm.migrationKey} v{selectedForm.schemaVersion}
                        {availableVersions.length > 1
                          ? ` → available targets: ${availableVersions.join(", ")}`
                          : " → no alternate targets registered"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Submission preview</CardTitle>
                  {selectedForm ? (
                    <select
                      value={String(targetVersion)}
                      onChange={(event) => setTargetVersion(Number(event.target.value))}
                      className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs"
                    >
                      {availableVersions.map((version: number) => (
                        <option key={version} value={version}>
                          Target v{version}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  {submitMessage || "Submit a form to inspect the captured payload."}
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Raw form values
                    </p>
                    <ScrollArea className="h-[180px]">
                      <pre className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        {JSON.stringify(payloadSource, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Migrated payload{" "}
                      {selectedForm ? `(target v${targetVersion})` : ""}
                    </p>
                    {migratedPayloadResult.ok ? (
                      <ScrollArea className="h-[180px]">
                        <pre className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                          {JSON.stringify(migratedPayloadResult.payload, null, 2)}
                        </pre>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-destructive">
                        {migratedPayloadResult.error}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
