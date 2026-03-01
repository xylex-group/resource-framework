"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ComboBox,
  ComboBoxContent,
  ComboBoxInput,
  ComboBoxItem,
} from "@/components/ui/combo-box";
import { useUserStore } from "@/lib/stores";
import type { FieldEditorSpec, FieldSpec, Primitive } from "../resource-types";
import { fetchDataViaAthena } from "../adapters/athena-gateway";

export type { FieldEditorSpec, FieldSpec, Primitive };

/**
 * Dialog component that renders form fields based on a specification
 * @param props - Component props including spec, initial values, and callbacks
 * @returns React component
 */
export function SpecDrivenDialog(props: {
  open: boolean;
  onCloseAction: () => void;
  title: string;
  spec: Array<FieldSpec>;
  requiredKeys?: string[];
  initial?: Partial<Record<string, Primitive>>;
  pending?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit(values: Record<string, unknown>): void;
  stripEmpty?: boolean;
  cacheEnabled?: boolean;
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
    cacheEnabled = false,
  } = props;

  const { user } = useUserStore();

  const [values, setValues] = useState<Record<string, Primitive>>(() => {
    const init: Record<string, Primitive> = {};
    const mapped = Array.isArray(spec) ? spec : [];
    mapped.forEach((s) => {
      const key = typeof s === "string" ? s : String(s?.column_name || "");
      if (!key) return;
      init[key] = initial[key] ?? "";
    });
    return init;
  });
  const [dataSourceOptions, setDataSourceOptions] = useState<
    Map<string, Array<{ label: string; value: string | number | boolean }>>
  >(new Map());

  const [isOpen, setIsOpen] = useState(open);

  if (open !== isOpen) {
    setIsOpen(open);
    if (open) {
      const init: Record<string, Primitive> = {};
      const mapped = Array.isArray(spec) ? spec : [];
      mapped.forEach((s) => {
        const key = typeof s === "string" ? s : String(s?.column_name || "");
        if (!key) return;
        init[key] = initial[key] ?? "";
      });
      setValues(init);
    }
  }

  const fields = useMemo(() => {
    const normalize = (s: FieldSpec) => {
      if (typeof s === "string") {
        return {
          key: s,
          label: String(s),
          hidden: false,
          data_type: "",
          editor: undefined as FieldEditorSpec | undefined,
        };
      }
      const key = String(s?.column_name || "").trim();
      const label = String(s?.header_label || s?.header || key).trim();
      return {
        key,
        label: label.replace(/_/g, " "),
        hidden: Boolean(s?.hidden),
        data_type: String(s?.data_type || ""),
        editor: s?.editor,
      };
    };
    const detectType = (
      dataType: string,
      editor?: FieldEditorSpec,
    ): "text" | "number" | "boolean" | "select" | "date" => {
      if (editor?.type) return editor.type;
      const dt = String(dataType || "").toLowerCase();
      if (dt.includes("bool")) return "boolean";
      if (
        dt.includes("num") ||
        dt.includes("int") ||
        dt.includes("decimal") ||
        dt.includes("currency")
      ) {
        return "number";
      }
      if (dt.includes("date") || dt.includes("time")) {
        return "date";
      }
      return editor?.options ? "select" : "text";
    };
    const detectDateMode = (dataType: string) => {
      const dt = String(dataType || "").toLowerCase();
      if (dt.includes("unixtime")) return "unixtime";
      if (dt.includes("timestamp") || dt.includes("datetime")) {
        return "datetime";
      }
      if (dt.includes("date")) return "date";
      return undefined;
    };

    return (Array.isArray(spec) ? spec : [])
      .map(normalize)
      .filter((f) => f.key && !f.hidden)
      .map((f) => {
        const type = detectType(f.data_type, f.editor);
        const options = type === "select" && Array.isArray(f.editor?.options)
          ? f.editor?.options
          : undefined;
        return {
          ...f,
          type,
          options,
          data_source: f.editor?.data_source,
          dateInputMode: detectDateMode(f.data_type),
        };
      });
  }, [spec]);

  // Fetch options for data_source fields
  useEffect(() => {
    if (!open || !user?.user_id || !user?.organization_id) return;

    const fetchDataSources = async () => {
      const optionMap = new Map<
        string,
        Array<{ label: string; value: string | number | boolean }>
      >();
      const promises: Promise<void>[] = [];

      fields.forEach((f) => {
        if (!f.data_source) return;
        if (typeof f.data_source === "string") {
          if (f.data_source.startsWith("user.")) return;
          if (f.data_source === "uuid_v4_gen") return;
          if (!f.data_source.includes(".")) return;
        }

        promises.push(
          (async () => {
            try {
              const ds = typeof f.data_source === "string"
                ? {
                  table: f.data_source.split(".")[0],
                  value_column: undefined,
                  label_column: undefined,
                }
                : f.data_source;
              const table = ds?.table;
              if (!table) return;
              const conditions: Array<
                { eq_column: string; eq_value: unknown }
              > = [];
              if (user?.organization_id) {
                conditions.push({
                  eq_column: "organization_id",
                  eq_value: user.organization_id,
                });
              }

              const result = await fetchDataViaAthena({
                table_name: table,
                conditions: conditions.map((c) => ({
                  eq_column: String(c.eq_column),
                  eq_value: c.eq_value as string | number | boolean | null,
                })),
                limit: 100,
              });

              if (result.error) return;
              const rows = Array.isArray(result.data) ? result.data : [];
              const valueCol = ds?.value_column || `${table}_id` || "id";
              const labelCol = ds?.label_column || "name";

              const pick = (row: Record<string, unknown>, key: string) => {
                if (key in row) return row[key];
                const camel = key.replace(
                  /_([a-z])/g,
                  (_, letter: string) => letter.toUpperCase(),
                );
                if (camel in row) return row[camel];
                return undefined;
              };

              optionMap.set(
                f.key,
                rows.map((r) => {
                  const row = r as Record<string, unknown>;
                  return {
                    label: String(
                      pick(row, labelCol) ?? pick(row, valueCol) ?? "",
                    ),
                    value: pick(row, valueCol) as string | number | boolean,
                  };
                }),
              );
            } catch (e) {
              console.error("Failed to fetch data_source options", e);
            }
          })(),
        );
      });

      await Promise.all(promises);
      setDataSourceOptions(optionMap);
    };

    fetchDataSources();
  }, [open, fields, user?.user_id, user?.company_id, cacheEnabled]);

  function handleSubmit() {
    const out: Record<string, unknown> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (!stripEmpty) {
        out[k] = v as unknown;
        return;
      }
      if (v === "" || v == null) return;
      out[k] = v as unknown;
    });
    onSubmit(out);
  }

  const hasMissingRequired = useMemo(() => {
    const keys = Array.isArray(requiredKeys) ? requiredKeys : [];
    if (keys.length === 0) return false;
    return keys.some((key) => {
      const v = values[key];
      return v == null || String(v).trim() === "";
    });
  }, [requiredKeys, values]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onCloseAction()}
    >
      <DialogContent className="max-w-155">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div
          id="spec-driven-dialog-fields"
          className="space-y-4"
        >
          {fields.map((col) => (
            <label key={col.key} className="flex flex-col gap-1">
              <span className="text-sm font-medium capitalize text-primary">
                {col.label}
              </span>
              {col.type === "boolean"
                ? (
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded-sm"
                      checked={Boolean(values[col.key])}
                      onChange={(e) =>
                        setValues((s) => ({
                          ...s,
                          [col.key]: e.target.checked,
                        }))}
                    />
                    <span className="text-xs text-primary">
                      {values[col.key] ? "Yes" : "No"}
                    </span>
                  </label>
                )
                : col.type === "select" && col.data_source
                ? (
                  <div className="w-full">
                    <ComboBox
                      selectedKey={values[col.key]
                        ? String(values[col.key])
                        : null}
                      shouldCloseOnBlur={false}
                      inputValue={String(values[col.key])}
                      closeOnReselect
                      allowsEmptyCollection={false}
                      keepAllItemsVisible={false}
                      onSelectionChange={(key) =>
                        setValues((s) => ({
                          ...s,
                          [col.key]: key == null ? "" : String(key),
                        }))}
                      onInputChange={(key) =>
                        setValues((s) => ({
                          ...s,
                          [col.key]: key == null ? "" : String(key),
                        }))}
                    >
                      <ComboBoxInput placeholder="Select..." />
                      <ComboBoxContent
                        className="max-w-none whitespace-nowrap pointer-events-auto"
                        popover={{
                          style: {
                            width: "auto",
                            minWidth: "var(--trigger-width)",
                            maxWidth: "min(calc(100vw - 2rem), 500px)",
                          },
                        }}
                      >
                        {(dataSourceOptions.get(col.key) || []).map((opt) => (
                          <ComboBoxItem
                            key={String(opt.value)}
                            id={String(opt.value)}
                            textValue={opt.label}
                          >
                            {opt.label}
                          </ComboBoxItem>
                        ))}
                      </ComboBoxContent>
                    </ComboBox>
                  </div>
                )
                : col.type === "select" && Array.isArray(col.options)
                ? (
                  <div className="w-full">
                    <ComboBox
                      selectedKey={values[col.key]
                        ? String(values[col.key])
                        : null}
                      shouldCloseOnBlur={false}
                      onSelectionChange={(key) =>
                        setValues((s) => ({
                          ...s,
                          [col.key]: key == null ? "" : String(key),
                        }))}
                      onInputChange={() => {}}
                    >
                      <ComboBoxInput placeholder="Select..." />
                      <ComboBoxContent
                        className="max-w-none whitespace-nowrap"
                        popover={{
                          style: {
                            width: "auto",
                            minWidth: "var(--trigger-width)",
                            maxWidth: "min(calc(100vw - 2rem), 500px)",
                          },
                        }}
                      >
                        {(col.options || []).map((opt) => (
                          <ComboBoxItem
                            key={String(opt.value)}
                            id={String(opt.value)}
                            textValue={String(opt.label ?? opt.value)}
                          >
                            {String(opt.label ?? opt.value)}
                          </ComboBoxItem>
                        ))}
                      </ComboBoxContent>
                    </ComboBox>
                  </div>
                )
                : col.dateInputMode
                ? (
                  <Input
                    className="h-8"
                    type={col.dateInputMode === "datetime"
                      ? "datetime-local"
                      : col.dateInputMode === "unixtime"
                      ? "number"
                      : "date"}
                    value={values[col.key] == null
                      ? ""
                      : String(values[col.key] ?? "")}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      const parsed = col.dateInputMode === "unixtime" &&
                          nextValue !== ""
                        ? Number(nextValue)
                        : nextValue;
                      setValues((s) => ({
                        ...s,
                        [col.key]: col.dateInputMode === "unixtime" &&
                            nextValue === ""
                          ? ""
                          : parsed,
                      }));
                    }}
                  />
                )
                : (
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-8"
                      type={col.type === "number" ? "number" : "text"}
                      value={values[col.key] == null
                        ? ""
                        : String(values[col.key] ?? "")}
                      onChange={(e) =>
                        setValues((s) => ({ ...s, [col.key]: e.target.value }))}
                    />
                  </div>
                )}
            </label>
          ))}
        </div>
        <DialogFooter>
          <div
            id="spec-driven-dialog-footer"
            className="flex justify-end gap-2 w-full "
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseAction}
              disabled={pending}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleSubmit()}
              disabled={pending || hasMissingRequired}
              className="rounded-sm"
            >
              {submitLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
