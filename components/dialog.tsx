"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ComboBox,
  ComboBoxContent,
  ComboBoxInput,
  ComboBoxItem,
} from "@/components/ui/combo-box";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useUserStore } from "@/lib/stores";
import { fetchDataViaAthena } from "../adapters/athena-gateway";
import type { FieldEditorSpec, FieldSpec, Primitive } from "../resource-types";

export type { FieldEditorSpec, FieldSpec, Primitive };

type Option = { label: string; value: string | number | boolean };
type FieldType = "text" | "number" | "boolean" | "select" | "date" | "textarea";

type NormalizedField = {
  key: string;
  label: string;
  type: FieldType;
  dataType: string;
  options?: Option[];
  dataSource?: FieldEditorSpec["data_source"];
  dateInputMode?: "date" | "datetime" | "unixtime";
};

function normalizeFields(spec: FieldSpec[]): NormalizedField[] {
  return spec.flatMap((item) => {
    const field = typeof item === "string"
      ? { column_name: item }
      : item;
    const key = String(field.column_name || "").trim();
    if (!key || field.hidden) return [];

    const dataType = String(field.data_type || "").toLowerCase();
    const editor = field.editor;
    const type: FieldType = editor?.type ??
      (dataType.includes("bool")
        ? "boolean"
        : dataType.includes("num") || dataType.includes("int") ||
            dataType.includes("decimal") || dataType.includes("currency")
        ? "number"
        : dataType.includes("date") || dataType.includes("time")
        ? "date"
        : editor?.options
        ? "select"
        : "text");
    const dateInputMode = dataType.includes("unixtime")
      ? "unixtime"
      : dataType.includes("timestamp") || dataType.includes("datetime")
      ? "datetime"
      : dataType.includes("date")
      ? "date"
      : undefined;

    return [{
      key,
      label: String(field.header_label || field.header || key)
        .replace(/_/g, " ")
        .trim(),
      type,
      dataType,
      options: Array.isArray(editor?.options) ? editor.options : undefined,
      dataSource: editor?.data_source,
      dateInputMode,
    }];
  });
}

function initializeValues(
  fields: NormalizedField[],
  initial: Partial<Record<string, Primitive>>,
): Record<string, Primitive> {
  return Object.fromEntries(
    fields.map((field) => [field.key, initial[field.key] ?? ""]),
  );
}

function pickValue(row: Record<string, unknown>, key: string): unknown {
  if (key in row) return row[key];
  const camelKey = key.replace(
    /_([a-z])/g,
    (_, letter: string) => letter.toUpperCase(),
  );
  return row[camelKey];
}

export function SpecDrivenDialog(props: {
  open: boolean;
  onCloseAction: () => void;
  title: string;
  spec: FieldSpec[];
  requiredKeys?: string[];
  initial?: Partial<Record<string, Primitive>>;
  pending?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit(values: Record<string, unknown>): void;
  stripEmpty?: boolean;
  cacheEnabled?: boolean;
  errorMessage?: string | null;
}) {
  const {
    open,
    onCloseAction,
    title,
    spec,
    requiredKeys = [],
    initial = {},
    pending = false,
    submitLabel = "Create",
    cancelLabel = "Cancel",
    onSubmit,
    stripEmpty = true,
    errorMessage = null,
  } = props;
  const { user } = useUserStore();
  const fields = useMemo(() => normalizeFields(spec), [spec]);
  const [values, setValues] = useState<Record<string, Primitive>>(() =>
    initializeValues(fields, initial)
  );
  const [dataSourceOptions, setDataSourceOptions] = useState<Map<string, Option[]>>(
    new Map(),
  );
  const [loadingDataSources, setLoadingDataSources] = useState(false);

  useEffect(() => {
    if (open) setValues(initializeValues(fields, initial));
  }, [open, fields, initial]);

  useEffect(() => {
    if (!open) return;
    const sourceFields = fields.filter((field) => {
      const source = field.dataSource;
      if (!source) return false;
      return typeof source !== "string" ||
        (source.includes(".") && !source.startsWith("user.") &&
          source !== "uuid_v4_gen");
    });
    if (sourceFields.length === 0) {
      setDataSourceOptions(new Map());
      return;
    }

    let cancelled = false;
    setLoadingDataSources(true);
    void Promise.all(sourceFields.map(async (field) => {
      const source = typeof field.dataSource === "string"
        ? { table: field.dataSource.split(".")[0] }
        : field.dataSource;
      if (!source?.table) return [field.key, [] as Option[]] as const;
      const result = await fetchDataViaAthena<Record<string, unknown>[]>({
        table_name: source.table,
        conditions: user?.organization_id
          ? [{ eq_column: "organization_id", eq_value: user.organization_id }]
          : [],
        limit: 100,
      });
      if (result.error) throw new Error(result.error);
      const valueColumn = source.value_column || `${source.table}_id`;
      const labelColumn = source.label_column || "name";
      const options = (result.data || []).flatMap((row) => {
        const value = pickValue(row, valueColumn);
        if (typeof value !== "string" && typeof value !== "number" &&
          typeof value !== "boolean") return [];
        return [{
          value,
          label: String(pickValue(row, labelColumn) ?? value),
        }];
      });
      return [field.key, options] as const;
    })).then((entries) => {
      if (!cancelled) setDataSourceOptions(new Map(entries));
    }).catch(() => {
      if (!cancelled) setDataSourceOptions(new Map());
    }).finally(() => {
      if (!cancelled) setLoadingDataSources(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, fields, user?.organization_id]);

  const requiredSet = useMemo(() => new Set(requiredKeys), [requiredKeys]);
  const missingRequired = requiredKeys.some((key) => {
    const value = values[key];
    return value == null || (typeof value === "string" && value.trim() === "");
  });

  const submit = () => {
    const entries = Object.entries(values).filter(([, value]) =>
      !stripEmpty || (value !== "" && value != null)
    );
    onSubmit(Object.fromEntries(entries));
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCloseAction()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700 dark:border-danger-800 dark:bg-danger-950 dark:text-danger-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          {fields.map((field) => {
            const required = requiredSet.has(field.key);
            const loading = pending || (Boolean(field.dataSource) && loadingDataSources);
            const wide = field.type === "textarea" || field.key === "notes";
            const inputType = field.type === "number"
              ? "number"
              : field.key.includes("email")
              ? "email"
              : field.key.includes("phone") || field.key.includes("contact_number")
              ? "tel"
              : "text";
            const autoComplete = field.key === "first_name"
              ? "given-name"
              : field.key === "last_name"
              ? "family-name"
              : field.key.includes("email")
              ? "email"
              : field.key.includes("phone") || field.key.includes("contact_number")
              ? "tel"
              : "off";

            return (
              <label
                key={field.key}
                className={`flex min-w-0 flex-col gap-2 ${wide ? "md:col-span-2" : ""}`}
              >
                <span className="text-sm font-medium capitalize text-foreground">
                  {field.label}
                  {required && <span className="ml-1 text-danger-600">*</span>}
                </span>
                {loading
                  ? <Skeleton className="h-10 w-full rounded-lg" />
                  : field.type === "boolean"
                  ? (
                    <span className="flex h-10 items-center gap-3 rounded-lg border border-input bg-background px-3">
                      <Checkbox
                        id={field.key}
                        name={field.key}
                        aria-label={field.label}
                        checked={Boolean(values[field.key])}
                        onCheckedChange={(checked) =>
                          setValues((current) => ({ ...current, [field.key]: checked }))}
                      />
                      <span className="text-sm text-foreground">
                        {values[field.key] ? "Yes" : "No"}
                      </span>
                    </span>
                  )
                  : field.type === "select"
                  ? (
                    <ComboBox
                      ariaLabel={field.label}
                      selectedKey={values[field.key] == null || values[field.key] === ""
                        ? null
                        : String(values[field.key])}
                      onSelectionChange={(key) =>
                        setValues((current) => ({
                          ...current,
                          [field.key]: key == null ? "" : String(key),
                        }))}
                      onInputChange={() => {}}
                    >
                      <ComboBoxInput
                        ariaLabel={field.label}
                        className="rounded-lg border border-input bg-background"
                        name={field.key}
                      />
                      <ComboBoxContent className="max-w-none whitespace-nowrap">
                        {(field.dataSource
                          ? dataSourceOptions.get(field.key) || []
                          : field.options || []).map((option) => (
                            <ComboBoxItem
                              key={String(option.value)}
                              id={String(option.value)}
                              textValue={option.label}
                            >
                              {option.label}
                            </ComboBoxItem>
                          ))}
                      </ComboBoxContent>
                    </ComboBox>
                  )
                  : field.type === "textarea"
                  ? (
                    <Textarea
                      id={field.key}
                      name={field.key}
                      autoComplete={autoComplete}
                      className="min-h-28 resize-y rounded-lg border border-input bg-background"
                      value={values[field.key] == null ? "" : String(values[field.key])}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))}
                      aria-required={required}
                    />
                  )
                  : (
                    <Input
                      id={field.key}
                      name={field.key}
                      autoComplete={autoComplete}
                      className="h-10 rounded-lg border border-input bg-background"
                      type={field.dateInputMode === "datetime"
                        ? "datetime-local"
                        : field.dateInputMode === "date"
                        ? "date"
                        : field.dateInputMode === "unixtime"
                        ? "number"
                        : inputType}
                      value={values[field.key] == null ? "" : String(values[field.key])}
                      onChange={(event) => {
                        const value = field.type === "number" && event.target.value !== ""
                          ? Number(event.target.value)
                          : event.target.value;
                        setValues((current) => ({ ...current, [field.key]: value }));
                      }}
                      aria-required={required}
                    />
                  )}
              </label>
            );
          })}
        </div>

        <DialogFooter>
          <div className="flex w-full justify-end gap-2">
            {pending
              ? (
                <>
                  <Skeleton className="h-9 w-20 rounded-lg" />
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </>
              )
              : (
                <>
                  <Button variant="outline" size="sm" onClick={onCloseAction} className="rounded-lg">
                    {cancelLabel}
                  </Button>
                  <Button
                    size="sm"
                    onClick={submit}
                    disabled={missingRequired || fields.length === 0 || loadingDataSources}
                    className="rounded-lg"
                  >
                    {submitLabel}
                  </Button>
                </>
              )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
