"use client";

import React, { type Dispatch, type ReactNode, type SetStateAction } from "react";
import { TextSelect, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CalendarInputForm } from "@/components/inputs/calendar-input-form";
import TabsWithContent from "@/components/tabs/tabs-with-content";
import { getAthenaEditorType } from "../athena/model-metadata";
import { buildColumnsFromRegistry, defaultEditorByColumn } from "../constructors/column-registry";
import type { LeanColumnSpec, ResourceDrilldownRoute, ResourceRoute } from "../resource-types";
import { convertDateInputValue, detectDateInputMode, toDatePickerValue, toDateTimeLocalValue } from "../utils/date-utils";
import { formatValueForInput } from "../utils/format";
import type { ColumnConfigObject, EditorConfig, FormStateData, ResourceData, SelectOption } from "@/lib/types";
import { AddField } from "./edit-state/add-field";
import SelectDataSource from "./fields/select-data-source";
import { getSectionGridClass, isEmptyValue } from "./resource_drilldown_helpers";
import { ResourceDrilldownNoEditFields } from "./sections/no-edit-fields";

export interface ResourceDrilldownEditorProps {
  activeEditTabIndex: number;
  athenaModelName?: string;
  data?: ResourceData;
  drilldownConfig?: ResourceDrilldownRoute;
  formState: FormStateData;
  resource: ResourceRoute;
  resourceId?: string;
  resourceName?: string;
  setActiveEditTabIndex: Dispatch<SetStateAction<number>>;
  setFormState: Dispatch<SetStateAction<FormStateData>>;
  setVisibleFields: Dispatch<SetStateAction<Set<string>>>;
  visibleFields: Set<string>;
}

export function ResourceDrilldownEditor({
  activeEditTabIndex,
  athenaModelName,
  data,
  drilldownConfig: drilldownCfg,
  formState,
  resource,
  resourceId: resource_id,
  resourceName: resource_name,
  setActiveEditTabIndex,
  setFormState,
  setVisibleFields,
  visibleFields,
}: ResourceDrilldownEditorProps) {
              const configured = resource.columns;
              const row = data || {};

              const editCfg = resource?.edit || {};
              const allowedColumns = Array.isArray(editCfg.allowedColumns)
                ? editCfg.allowedColumns
                : null;
              const denied = Array.isArray(editCfg.deniedColumns)
                ? new Set<string>(editCfg.deniedColumns)
                : new Set<string>();
              denied.add(resource.idColumn);

              let keys: string[] = [];
              if (allowedColumns) {
                keys = allowedColumns;
              } else {
                keys = Array.isArray(configured)
                  ? configured
                    .filter(
                      (c) =>
                        !(
                          typeof c === "object" &&
                          (c as ColumnConfigObject)?.hidden
                        ),
                    )
                    .map((c) =>
                      typeof c === "string"
                        ? c
                        : (c as ColumnConfigObject).column_name
                    )
                  : Object.keys(row);
              }

              keys = keys.filter((k) => !denied.has(k));

              if (keys.length === 0) {
                const canCreateNew = resource?.enableNewResourceCreation &&
                  (resource?.newResourceHref || resource?.newResourceOnClick);
                const createLabel = resource?.newResourceButtonText ||
                  `New ${resource?.page_label || resource_name}`;

                return (
                  <ResourceDrilldownNoEditFields
                    id="resource-drilldown-no-edit-fields"
                    canCreateNew={Boolean(
                      canCreateNew && resource?.newResourceHref,
                    )}
                    href={resource?.newResourceHref || undefined}
                    createLabel={createLabel}
                  />
                );
              }

              const specs: Array<LeanColumnSpec<ResourceData>> = (
                Array.isArray(configured)
                  ? configured.map((c) =>
                    typeof c === "string"
                      ? { key: c, header: c.replace(/_/g, " ") }
                      : {
                        key: (c as ColumnConfigObject).column_name,
                        header: (c as ColumnConfigObject).header ||
                          (c as ColumnConfigObject).header_label,
                        // Map ResourceRoute.columns.editable -> editor for drilldown
                        editor: (() => {
                          const editable = (c as ColumnConfigObject)
                            ?.editable;
                          if (editable && typeof editable === "object") {
                            const t = String(
                              editable.type || "",
                            ).toLowerCase();

                            if (
                              t === "select" ||
                              t === "boolean" ||
                              t === "text" ||
                              t === "number"
                            ) {
                              return {
                                type: t as
                                  | "select"
                                  | "boolean"
                                  | "text"
                                  | "number",
                                options: Array.isArray(editable.options)
                                  ? editable.options
                                  : undefined,
                                data_source: editable.data_source,
                                update_table: editable.update_table,
                                update_id_column: editable.update_id_column,
                                update_column: editable.update_column,
                              };
                            }
                          }

                          const explicit = (c as { editor?: EditorConfig })
                            ?.editor;
                          if (explicit) return explicit;
                          const fallback = defaultEditorByColumn[
                            String((c as ColumnConfigObject).column_name)
                          ];
                          return fallback
                            ? {
                              type: (fallback as { type?: string }).type as
                                | "select"
                                | "boolean"
                                | "text"
                                | "number"
                                | undefined,
                              options: Array.isArray(
                                  (fallback as { options?: unknown }).options,
                                )
                                ? (fallback as { options: SelectOption[] })
                                  .options
                                : undefined,
                            }
                            : undefined;
                        })(),
                      }
                  )
                  : Object.keys(row).map((k) => ({ key: k, header: k }))
              ) as Array<LeanColumnSpec<ResourceData>>;
              const colDefs = buildColumnsFromRegistry<ResourceData>(specs);
              const metaByKey = new Map<string, Record<string, unknown>>();
              const colDefByKey = new Map<string, unknown>();
              colDefs.forEach((col) => {
                const colWithAccessor = col as {
                  accessorKey?: string;
                  id?: string;
                  meta?: Record<string, unknown>;
                };
                const k = colWithAccessor?.accessorKey || colWithAccessor?.id;
                if (k) {
                  metaByKey.set(
                    k,
                    (colWithAccessor?.meta || {}) as Record<string, unknown>,
                  );
                  colDefByKey.set(k, col);
                }
              });

              // i dont like this need refactor
              const renderFields = (list: string[]) =>
                list.map((k) => {
                  const meta = metaByKey.get(k) || {};
                  const headerText = (meta.headerText as string) ||
                    k.replace(/_/g, " ");
                  const datatype = meta.datatype as string | undefined;
                  const rawEditorCfg = meta?.editor as EditorConfig | undefined;
                  const inferredEditorType = getAthenaEditorType(
                    athenaModelName,
                    k,
                  );
                  const editorCfg = rawEditorCfg
                    ? {
                      ...rawEditorCfg,
                      type: rawEditorCfg?.type ?? inferredEditorType,
                    }
                    : inferredEditorType
                    ? { type: inferredEditorType }
                    : undefined;
                  const value = formState[k];
                  const dateInputMode = detectDateInputMode(
                    editorCfg?.type,
                    datatype,
                  );
                  const isNumberField = editorCfg?.type === "number" ||
                    datatype === "number";
                  const handleDateInputChange = (inputValue: string) => {
                    if (!dateInputMode) return;
                    const next = convertDateInputValue(
                      inputValue,
                      dateInputMode,
                    );
                    setFormState((s) => ({
                      ...s,
                      [k]: next,
                    }));
                  };
                  const renderEditableInput = () => {
                    if (dateInputMode) {
                      if (dateInputMode === "date") {
                        return (
                          <div className="flex-1">
                            <CalendarInputForm
                              id={`resource-drilldown-date-${k}`}
                              fieldKey={k}
                              label={headerText}
                              value={toDatePickerValue(String(value))}
                              onChangeAction={handleDateInputChange}
                              className="w-full"
                            />
                          </div>
                        );
                      }
                      return (
                        <Input
                          className="h-8 flex-1"
                          type="datetime-local"
                          value={toDateTimeLocalValue(String(value))}
                          onChange={(e) =>
                            handleDateInputChange(e.target.value)}
                        />
                      );
                    }
                    if (editorCfg?.type === "textarea") {
                      return (
                        <Textarea
                          className="flex-1"
                          value={formatValueForInput(value)}
                          onChange={(e) =>
                            setFormState((s) => ({
                              ...s,
                              [k]: e.target.value,
                            }))}
                        />
                      );
                    }
                    if (isNumberField) {
                      return (
                        <NumberField
                          className="flex-1"
                          value={typeof value === "number" ? value : Number.NaN}
                          onValueChange={(val) =>
                            setFormState((s) => ({ ...s, [k]: val }))}
                        />
                      );
                    }
                    return (
                      <Input
                        className="h-8 flex-1"
                        type="text"
                        value={formatValueForInput(value)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFormState((s) => {
                            const newState = {
                              ...s,
                              [k]: e.target.value,
                            };

                            return newState;
                          });
                        }}
                      />
                    );
                  };

                  const isAddedField = visibleFields.has(k);

                  // Helper to check if value is empty
                  const isEmpty = (val: unknown): boolean => {
                    if (val === null || val === undefined) return true;
                    if (typeof val === "string" && val.trim() === "") {
                      return true;
                    }
                    if (typeof val === "number" && isNaN(val)) return true;
                    return false;
                  };

                  // Only show remove button if field is added AND currently empty
                  const isRemovable = isAddedField && isEmpty(value);

                  return (
                    <div
                      key={k}
                      id="data-source-container"
                      className="flex flex-col gap-1"
                    >
                      <span className="select-none text-sm font-medium text-primary">
                        {headerText}
                      </span>
                      {editorCfg?.type === "select" && editorCfg.data_source
                        ? (
                          <SelectDataSource
                            fieldKey={k}
                            value={value}
                            dataSource={editorCfg.data_source}
                            resource={resource}
                            resourceId={resource_id}
                            updateTable={editorCfg.update_table}
                            updateIdColumn={editorCfg.update_id_column}
                            updateColumn={editorCfg.update_column}
                            label={headerText}
                            onValueChange={(val) =>
                              setFormState((s) => ({ ...s, [k]: val }))}
                            isAddedField={isAddedField}
                            onRemove={() => {
                              setVisibleFields((prev) => {
                                const next = new Set(prev);
                                next.delete(k);
                                return next;
                              });
                              if (data) {
                                setFormState((prev) => ({
                                  ...prev,
                                  [k]: data[k],
                                }));
                              }
                            }}
                          />
                        )
                        : editorCfg?.type === "select" &&
                            Array.isArray(editorCfg.options)
                        ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Select
                                value={value == null
                                  ? ""
                                  : typeof value === "object"
                                  ? ""
                                  : String(value)}
                                onValueChange={(val: string) => {
                                  const opt = editorCfg.options!.find(
                                    (o) => String(o.value) === val,
                                  );
                                  const nextVal = opt ? opt.value : val;
                                  setFormState((s) => ({ ...s, [k]: nextVal }));
                                }}
                              >
                                <SelectTrigger className="min-w-45 rounded-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {editorCfg.options.map((opt, idx) => (
                                    <SelectItem
                                      key={`${String(opt.value)}-${idx}`}
                                      value={String(opt.value)}
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {isRemovable && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-sm hover:bg-destructive/10"
                                onClick={() => {
                                  setVisibleFields((prev) => {
                                    const next = new Set(prev);
                                    next.delete(k);
                                    return next;
                                  });
                                  if (data) {
                                    setFormState((prev) => ({
                                      ...prev,
                                      [k]: data[k],
                                    }));
                                  }
                                }}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        )
                        : editorCfg?.type === "boolean" ||
                            datatype === "boolean"
                        ? (
                          <div className="flex items-center gap-2">
                            <div className="inline-flex flex-1 items-center gap-2">
                              <Switch
                                checked={Boolean(value)}
                                onCheckedChange={(checked) =>
                                  setFormState((s) => ({
                                    ...s,
                                    [k]: checked,
                                  }))}
                              />
                              <span className="text-xs text-primary">
                                {value ? "Yes" : "No"}
                              </span>
                            </div>
                            {isRemovable && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-sm hover:bg-destructive/10"
                                onClick={() => {
                                  setVisibleFields((prev) => {
                                    const next = new Set(prev);
                                    next.delete(k);
                                    return next;
                                  });
                                  if (data) {
                                    setFormState((prev) => ({
                                      ...prev,
                                      [k]: data[k],
                                    }));
                                  }
                                }}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        )
                        : (
                          <div className="flex items-center gap-2">
                            {renderEditableInput()}
                            {isRemovable && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-sm hover:bg-destructive/10"
                                onClick={() => {
                                  setVisibleFields((prev) => {
                                    const next = new Set(prev);
                                    next.delete(k);
                                    return next;
                                  });
                                  if (data) {
                                    setFormState((prev) => ({
                                      ...prev,
                                      [k]: data[k],
                                    }));
                                  }
                                }}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        )}
                    </div>
                  );
                });

              // If drilldown sections are configured, mirror them in edit mode
              if (
                Array.isArray(drilldownCfg?.sections) &&
                drilldownCfg!.sections!.length > 0
              ) {
                return (
                  <div
                    id="resource-drilldown-edit-sections"
                    className="space-y-6 px-0"
                  >
                    {drilldownCfg!.sections!.map((section, idx: number) => {
                      const isLast = idx === drilldownCfg!.sections!.length - 1;
                      // All fields in section
                      const allSectionFields = (section.fields || [])
                        .map((f) =>
                          typeof f === "string" ? f : (f as { key: string }).key
                        )
                        .filter((k) =>
                          typeof k === "string" && keys.includes(k)
                        )
                        .filter((k: string) => {
                          const f = (section.fields || []).find((ff) =>
                            typeof ff === "string"
                              ? ff === k
                              : (ff as { key: string }).key === k
                          );
                          const hidden = typeof f === "object"
                            ? Boolean((f as { hidden?: boolean }).hidden)
                            : false;
                          return !hidden;
                        });

                      const preExistingInSection = allSectionFields.filter(
                        (k: string) => {
                          // Check original data, not formState, to see if field has a value from DB
                          const val = data?.[k];
                          return !isEmptyValue(val) && !visibleFields.has(k);
                        },
                      );
                      const addedInSection = allSectionFields.filter(
                        (k: string) => visibleFields.has(k),
                      );
                      const visibleInSection = [
                        ...preExistingInSection,
                        ...addedInSection,
                      ];
                      const hiddenInSection = allSectionFields.filter(
                        (k: string) => {
                          // Check original data - only show in "Add field" if empty in DB
                          const val = data?.[k];
                          return isEmptyValue(val) && !visibleFields.has(k);
                        },
                      );

                      // Return nothing if expose_to_edit_state is false
                      if (section.expose_to_edit_state === false) {
                        return null;
                      }

                      // Empty state for section: no visible fields and no hidden fields
                      if (
                        visibleInSection.length === 0 &&
                        hiddenInSection.length === 0
                      ) {
                        return (
                          <div
                            key={idx}
                            id={`resource-drilldown-section-${idx}-empty`}
                            className="space-y-3 px-3"
                          >
                            {section.title && (
                              <div className=" text-xl font-semibold text-primary">
                                {section.title}
                              </div>
                            )}
                            <div className="flex flex-col items-center justify-center rounded-sm bg-muted p-6 border">
                              <TextSelect className="h-4 w-4 text-icon" />
                              <p className="mt-2 text-sm text-secondary select-none">
                                No editable fields in this section
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <React.Fragment key={idx}>
                          <div
                            id={`resource-drilldown-section-${idx}`}
                            className="space-y-3 px-6"
                          >
                            {section.title && (
                              <div className="text-base font-medium text-primary">
                                {section.title}
                              </div>
                            )}
                            {visibleInSection.length > 0 && (
                              <div
                                id={`resource-drilldown-section-${idx}-grid`}
                                className={`grid ${
                                  getSectionGridClass(
                                    section.columns as number | undefined,
                                  )
                                } gap-4`}
                              >
                                {renderFields(visibleInSection)}
                              </div>
                            )}

                            {hiddenInSection.length > 0 && (
                              <AddField
                                hiddenInSection={hiddenInSection}
                                metaByKey={metaByKey as Map<
                                  string,
                                  {
                                    headerText?: string;
                                    [key: string]: unknown;
                                  }
                                >}
                                setVisibleFields={setVisibleFields}
                                setFormState={setFormState}
                                data={data || {}}
                                key={"resource-drilldown-field"}
                                className="mt-8"
                              />
                            )}
                          </div>
                          {!isLast && <Separator />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
              }

              // Build category index from configured columns (if any)
              const categoryByKey = new Map<string, string | undefined>();
              if (Array.isArray(configured)) {
                configured.forEach((c) => {
                  if (
                    typeof c === "object" &&
                    (c as ColumnConfigObject)?.column_name
                  ) {
                    const cat =
                      (c as ColumnConfigObject & { category?: string })
                        .category;
                    categoryByKey.set(
                      String((c as ColumnConfigObject).column_name),
                      cat,
                    );
                  }
                });
              }

              const declaredCategories = Array.isArray(resource.categories)
                ? (resource.categories as string[])
                : [];

              const grouped: Record<string, string[]> = {};
              const uncategorized: string[] = [];
              keys.forEach((k: string) => {
                const cat = categoryByKey.get(k);
                if (cat && typeof cat === "string" && cat.length > 0) {
                  if (!grouped[cat]) grouped[cat] = [];
                  grouped[cat]!.push(k);
                } else {
                  uncategorized.push(k);
                }
              });

              // If no categories declared and none assigned, fall back to flat grid
              const anyCategories = declaredCategories.length > 0 ||
                Object.keys(grouped).length > 0;
              if (!anyCategories) {
                return (
                  <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2">
                    {renderFields(keys)}
                  </div>
                );
              }

              const dynamicCats = Object.keys(grouped).filter(
                (c) => !declaredCategories.includes(c),
              );
              const ordered = [...declaredCategories, ...dynamicCats];

              // Build tabs
              const tabs: Array<{
                key: string;
                label: string;
                content: ReactNode;
              }> = [];

              if (uncategorized.length > 0) {
                tabs.push({
                  key: "General",
                  label: "General",
                  content: (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {renderFields(uncategorized)}
                    </div>
                  ),
                });
              }

              ordered.forEach((cat) => {
                const list = grouped[cat] || [];
                if (list.length === 0) return;
                tabs.push({
                  key: cat,
                  label: cat,
                  content: (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {renderFields(list)}
                    </div>
                  ),
                });
              });

              return (
                <div className="px-4">
                  <TabsWithContent
                    tabs={tabs}
                    activeIndex={activeEditTabIndex}
                    onTabChange={setActiveEditTabIndex}
                  />
                </div>
              );
}

