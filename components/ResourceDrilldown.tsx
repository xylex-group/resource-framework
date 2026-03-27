"use client";

import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApiClient } from "../hooks/use-api-client";
import { useUpdateData } from "../hooks/use-update-data";
import { fetchDataViaAthena } from "../adapters/athena-gateway";

import { useNotification } from "@/hooks/use-notifications";
import { Code2, Pencil, TextSelect, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RESOURCE_DRILLDOWN_ROUTES } from "../registries/resource-drilldown-routes";
import { RESOURCE_ROUTES } from "../registries/resource-routes";
import { type ResourceRoute } from "../resource-types";
import { useContentStore, useUserStore, useViewStore } from "@/lib/stores";
import { getDrizzleEditorType } from "../utils/drizzle-editor";
import { AddField } from "./edit-state/add-field";
import { ResourceDrilldownNoEditFields } from "./sections/no-edit-fields";
import { handleSaveAll } from "./edit-state/save-all";
import SelectDataSource from "./fields/select-data-source";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import ErrorBlock from "@/components/ui/error";
import { ResponsiveDropdownV2 } from "@/components/ui-responsive/responsive-dropdown-v2";
import { ResponsiveDialog } from "@/components/ui-responsive/responsive-dialog";
import { DrilldownEntityRenderer } from "./drilldown/drilldown-entity-renderer";
import { DrilldownLayout } from "./drilldown/drilldown-layout";
import { JsonBlock } from "@/components/json/json-block";
import TabsWithContent from "@/components/tabs/tabs-with-content";
import {
  buildColumnsFromRegistry,
  defaultEditorByColumn,
  type LeanColumnSpec,
} from "../constructors/column-registry";
import { coerceByDatatype } from "../utils/coerce";
import { CalendarInputForm } from "@/components/inputs/calendar-input-form";
import { useUserScopes } from "../hooks/useUserScopes";
import { UnsavedChanges } from "./edit-state/unsaved-changes";
import type {
  ApiResult,
  ColumnConfigObject,
  ColumnConfiguration,
  DrilldownField,
  EditorConfig,
  FetchCondition,
  FormStateData,
  RemoteResourceRouteResponse,
  ResourceData,
  SelectOption,
} from "@/lib/types";
import {
  getDrilldownTitle,
  getSectionGridClass,
  isEmptyValue,
} from "./resource_drilldown_helpers";
import { formatValueForInput } from "../utils/format";

import {
  convertDateInputValue,
  detectDateInputMode,
  toDatePickerValue,
  toDateTimeLocalValue,
} from "../utils/date-utils";

const INVALID_RESOURCE_ID_VALUES = new Set(["", "new", "undefined", "null"]);

function hasUsableResourceId(resourceId?: string): boolean {
  const value = String(resourceId ?? "").trim();
  return !INVALID_RESOURCE_ID_VALUES.has(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
}

function mapRouteColumns(cols: unknown): ColumnConfiguration[] {
  return toStringArray(cols)
    .map((column) =>
      typeof column === "string"
        ? column
        : column &&
            typeof column === "object" &&
            (column as ColumnConfigObject).column_name
        ? (column as ColumnConfigObject)
        : null
    )
    .filter((item): item is ColumnConfiguration => item !== null);
}

function mapRemoteResourceRoute(
  remoteRow: RemoteResourceRouteResponse,
  resourceName: string,
): ResourceRoute {
  return {
    table: remoteRow?.table || resourceName,
    idColumn: remoteRow?.id_column || "id",
    drizzleTable: remoteRow?.table as string | undefined,
    schema: remoteRow?.schema || undefined,
    force_no_cache: Boolean(remoteRow?.force_no_cache),
    permanent_edit_state: Boolean(remoteRow?.permanent_edit_state),
    force_remove_back_button_store_on_index_resource: Boolean(
      remoteRow?.force_remove_back_button_store_on_index_resource,
    ),
    enableSearch: Boolean(remoteRow?.enable_search),
    searchBy: remoteRow?.search_by || undefined,
    avatar_column: remoteRow?.avatar_column || undefined,
    icon: remoteRow?.icon || undefined,
    page_label: remoteRow?.page_label || undefined,
    enableNewResourceCreation: Boolean(remoteRow?.enable_new_resource_creation),
    newResourceButtonText: remoteRow?.new_resource_button_text || undefined,
    newResourceHref: remoteRow?.new_resource_href || undefined,
    forceWrappingHeaderLabels: Boolean(remoteRow?.force_wrapping_header_labels),
    disableCompanyFilter: Boolean(remoteRow?.disable_company_filter),
    columns: mapRouteColumns(remoteRow?.columns),
    companyIdColumn: remoteRow?.organization_id_column ||
      remoteRow?.company_id_column ||
      undefined,
    edit: {
      enabled: Boolean(remoteRow?.enable_edit),
      allowedColumns: toStringArray(remoteRow?.allowed_columns_edit),
      deniedColumns: toStringArray(remoteRow?.denied_columns_edit),
      scope: remoteRow?.scope || undefined,
      IgnoreCompanyCheckBeforeMutation: Boolean(
        remoteRow?.ignore_company_check_before_mutation,
      ),
    },
  } as ResourceRoute;
}

function buildDrilldownConditions({
  resource,
  organizationId,
  resourceId,
  hasValidResourceId,
}: {
  resource: ResourceRoute | null;
  organizationId?: string;
  resourceId?: string;
  hasValidResourceId: boolean;
}): FetchCondition[] {
  const list: FetchCondition[] = [];

  if (resource && !resource.disableCompanyFilter && organizationId) {
    list.push({
      eq_column: resource.companyIdColumn || "organization_id",
      eq_value: organizationId,
    });
  }

  if (hasValidResourceId && resource?.idColumn) {
    list.push({
      eq_column: resource.idColumn,
      eq_value: resourceId,
    });
  }

  return list;
}

export const ResourceDrilldown = ({
  resourceName,
  resourceId,
}: {
  resourceName?: string;
  resourceId?: string;
}) => {
  const params = useParams<{
    resource_name: string;
    resource_id: string;
  }>();

  const resource_name = resourceName ?? params?.resource_name;
  const resource_id = resourceId ?? params?.resource_id;
  const isNewResource = String(resource_id || "") === "new";
  const hasValidResourceId = hasUsableResourceId(resource_id);

  const { user } = useUserStore();
  const { view } = useViewStore();
  const router = useRouter();
  const { notification } = useNotification();
  const {
    setHeaderActions,
    setTitle,
    setSubtitle,
    setTitleIcon,
    clear: clearContentStore,
  } = useContentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<FormStateData>({});
  const [activeEditTabIndex, setActiveEditTabIndex] = useState(0);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const visibleFieldsRef = useRef(visibleFields);
  const [showJson, setShowJson] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const staticResource = RESOURCE_ROUTES
    ?.[resource_name as keyof typeof RESOURCE_ROUTES];
  const [remoteResource, setRemoteResource] = useState<ResourceRoute | null>(
    null,
  );

  const [resourceLoading, setResourceLoading] = useState(false);
  const { hasScope } = useUserScopes({ cache_enabled: true });
  const cacheExperimental = hasScope("xbp_cache_experimental_v2");
  const resource: ResourceRoute | null = useMemo(
    () => (staticResource as ResourceRoute) || remoteResource,
    [staticResource, remoteResource],
  );
  const tableName = resource?.table;
  const tableString: string = Array.isArray(tableName)
    ? tableName[0] || ""
    : tableName || "";
  const drizzleTableName = resource?.drizzleTable ||
    (tableString ? (tableString as string) : undefined);

  useEffect(() => {
    let cancelled = false;
    async function loadRoute() {
      try {
        if (staticResource || !resource_name || !user?.organization_id) {
          return;
        }
        setResourceLoading(true);
        async function fetchRouteBy(column: "resource_name" | "table") {
          const response = await fetchDataViaAthena({
            table_name: "resource_routes",
            schema: "public",
            conditions: [{ eq_column: column, eq_value: resource_name }],
            limit: 1,
          });

          if (response.error) return null;
          const rows = Array.isArray(response.data) ? response.data : [];
          return rows.length > 0 ? rows[0] : null;
        }

        let row = await fetchRouteBy("resource_name");
        if (!row) {
          row = await fetchRouteBy("table");
        }
        if (!row || cancelled) return;

        const remoteRow = row as RemoteResourceRouteResponse;
        setRemoteResource(
          mapRemoteResourceRoute(remoteRow, String(resource_name)),
        );
      } finally {
        if (!cancelled) setResourceLoading(false);
      }
    }
    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [staticResource, resource_name, user?.user_id, user?.organization_id]);

  const conditions = useMemo<FetchCondition[]>(() => {
    return buildDrilldownConditions({
      resource,
      organizationId: user?.organization_id,
      resourceId: resource_id,
      hasValidResourceId,
    });
  }, [
    user?.organization_id,
    resource_id,
    hasValidResourceId,
    resource?.idColumn,
    resource?.disableCompanyFilter,
    resource?.companyIdColumn,
  ]);

  const apiResult = useApiClient<ResourceData>({
    table: tableString as string,
    schema: resource?.schema || "public",
    conditions,
    forceExternalApi: resource?.force_external_api_updates || false,
    columns: useMemo(() => {
      try {
        const configured = resource?.columns;

        const referencedColumns = new Set<string>();
        if (Array.isArray(configured)) {
          configured.forEach((c) => {
            if (
              typeof c === "object" &&
              (c as ColumnConfigObject)?.cell_value_mask_label
            ) {
              const maskLabel = (c as ColumnConfigObject).cell_value_mask_label;
              if (maskLabel) {
                const matches = maskLabel.matchAll(/\{\{(.*?)\}\}/g);
                for (const match of matches) {
                  const columnName = match[1]?.trim();
                  if (columnName && !columnName.includes(".")) {
                    referencedColumns.add(columnName);
                  }
                }
              }
            }
          });
        }

        const base = Array.isArray(configured)
          ? configured
            .filter(
              (c) =>
                !(typeof c === "object" && (c as ColumnConfigObject)?.hidden),
            )
            .map((c) =>
              typeof c === "string" ? c : (c as ColumnConfigObject).column_name
            )
          : [];
        const withId = new Set<string>(
          [
            ...base,
            ...Array.from(referencedColumns),
            resource?.idColumn || "id",
            resource?.avatar_column || undefined,
          ].filter((item): item is string => Boolean(item)),
        );
        return Array.from(withId);
      } catch {
        const cols = new Set<string>(
          [
            resource?.idColumn || "id",
            resource?.avatar_column || undefined,
          ].filter((item): item is string => Boolean(item)),
        );
        return Array.from(cols);
      }
    }, [resource?.columns, resource?.idColumn, resource?.avatar_column]),
    enabled: Boolean(
      resource?.table &&
        user?.user_id &&
        user?.organization_id &&
        !isNewResource &&
        hasValidResourceId &&
        Boolean(resource?.idColumn),
    ),
    noCache: (() => {
      const flag = resource?.force_no_cache;
      if (flag === true) return true;
      if (flag === false) return false;
      return !cacheExperimental;
    })(),
    single: true,
  });
  const { data, isLoading, isError, error, mutate } = apiResult as
    & ApiResult<ResourceData>
    & { mutate?: () => Promise<void> };

  useEffect(() => {
    try {
      if (data && (isEditing || resource?.permanent_edit_state)) {
        setFormState((prev) => {
          const preserved: Record<string, unknown> = {};
          for (const key in prev) {
            if (
              !(key in data) &&
              visibleFieldsRef.current?.has(key)
            ) {
              preserved[key] = prev[key];
            }
          }
          return { ...data, ...preserved };
        });
      }
    } catch {}
  }, [isEditing, data, resource?.permanent_edit_state]);

  useEffect(() => {
    visibleFieldsRef.current = visibleFields;
  }, [visibleFields]);

  // Auto-show fields that have non-empty values on initial load
  useEffect(() => {
    if (!data || !isEditing) return;

    const configured = resource?.columns;
    const configuredKeys = new Set(
      Array.isArray(configured)
        ? configured
          .filter(
            (c) =>
              !(typeof c === "object" && (c as ColumnConfigObject)?.hidden),
          )
          .map((c) =>
            typeof c === "string" ? c : (c as ColumnConfigObject).column_name
          )
        : [],
    );

    // Helper to check if a value is non-empty
    const hasValue = (val: unknown): boolean => {
      if (val === null || val === undefined) return false;
      if (typeof val === "string" && val.trim() === "") return false;
      if (typeof val === "number" && isNaN(val)) return false;
      return true;
    };

    // Find fields with values that aren't in configured columns
    const fieldsWithValues = Object.keys(data).filter(
      (key) => !configuredKeys.has(key) && hasValue(data[key]),
    );

    if (fieldsWithValues.length > 0) {
      setVisibleFields((prev) => {
        const next = new Set(prev);
        fieldsWithValues.forEach((key) => next.add(key));
        return next;
      });
    }
  }, [data, isEditing, resource?.columns]);

  // Organization validation: redirect if resource belongs to different organization
  useEffect(() => {
    if (data && user?.organization_id) {
      const dataOrgId = (data as Record<string, unknown>).organization_id;

      if (dataOrgId && dataOrgId !== user.organization_id) {
        // User switched orgs and no longer has access to this resource
        notification({
          message: "resource not found in current organization",
          success: false,
        });

        router.push("/v2/" + resource_name);
      }
    }
  }, [data, user?.organization_id, resource_name, router, notification]);

  // Force edit mode when permanent_edit_state is enabled
  useEffect(() => {
    if (resource?.permanent_edit_state) {
      setIsEditing(true);
    }
  }, [resource?.permanent_edit_state]);

  const { update, isLoading: isSaving } = useUpdateData({
    table: resource?.table || "",
    column: resource?.idColumn || "",
    id: String(resource_id),
    updateBody: {},
    config: {
      onSuccess: () => {
        notification({ message: "Saved", success: true });
        setSaveSuccess(true);
        setSaveError(false);
        setTimeout(() => setSaveSuccess(false), 2000);
      },
      onError: () => {
        notification({ message: "Save failed", success: false });
        setSaveError(true);
        setSaveSuccess(false);
        setTimeout(() => setSaveError(false), 2000);
      },
    },
  });

  const handleSaveCallback = async () => {
    setSaveSuccess(false);
    setSaveError(false);
    await handleSaveAll({
      resource,
      data: data ?? null,
      setIsEditing,
      formState,
      notification,
      update,
      mutate,
      setVisibleFields,
    });
  };

  const handleResetChanges = () => {
    if (data) {
      setFormState({ ...data });
    }
    setSaveSuccess(false);
    setSaveError(false);
    setVisibleFields(new Set());
  };

  // Cache for data_source labels
  const [dataSourceLabels, setDataSourceLabels] = useState<Map<string, string>>(
    new Map(),
  );

  // Calculate pending changes count and details
  const { pendingChangesCount, pendingChangesList } = useMemo(() => {
    if (!isEditing || !data) {
      return { pendingChangesCount: 0, pendingChangesList: [] };
    }

    const original = { ...data };
    const keys = Object.keys(formState);
    let changesCount = 0;
    const changesList: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }> = [];

    // Build column definitions to get datatypes and labels
    const specs: Array<LeanColumnSpec<ResourceData>> = [];
    if (resource?.columns) {
      for (const [colName, colObj] of Object.entries(resource.columns)) {
        if (typeof colObj === "object" && colObj !== null) {
          specs.push({
            key: colName,
            ...colObj,
          } as LeanColumnSpec<ResourceData>);
        }
      }
    }

    const colDefs = buildColumnsFromRegistry<ResourceData>(specs);
    const datatypeByKey = new Map<string, string | undefined>();
    const labelByKey = new Map<string, string>();

    colDefs.forEach((col) => {
      const colWithAccessor = col as {
        accessorKey?: string;
        id?: string;
        meta?: { datatype?: string; headerText?: string };
      };

      const k = colWithAccessor?.accessorKey || colWithAccessor?.id;
      const dt = colWithAccessor?.meta?.datatype;
      const label = colWithAccessor?.meta?.headerText;
      if (k) {
        datatypeByKey.set(k, dt);
        if (label) labelByKey.set(k, label);
      }
    });

    keys.forEach((k) => {
      const nextRaw = formState[k];
      const prevRaw = original[k];
      const dt = datatypeByKey.get(k);
      const next = coerceByDatatype(nextRaw, dt);
      const prev = coerceByDatatype(prevRaw, dt);
      const changed = JSON.stringify(next) !== JSON.stringify(prev);
      if (changed) {
        changesCount++;
        const fieldLabel = labelByKey.get(k) || k.replace(/_/g, " ");
        changesList.push({
          field: fieldLabel,
          oldValue: prev,
          newValue: next,
        });
      }
    });

    return {
      pendingChangesCount: changesCount,
      pendingChangesList: changesList,
    };
  }, [isEditing, data, formState, resource?.columns]);

  // Fetch labels for data_source fields
  useEffect(() => {
    if (!data || !resource) return;
    const configured = resource?.columns;
    if (!Array.isArray(configured)) return;

    const fetchLabels = async () => {
      const labelMap = new Map<string, string>();
      const promises: Promise<void>[] = [];

      configured.forEach((c) => {
        if (
          typeof c === "object" &&
          (c as ColumnConfigObject)?.editable?.data_source
        ) {
          const colConfig = c as ColumnConfigObject;
          const key = colConfig.column_name;
          const value = data[key];
          if (!value) return;

          const dsConfig = colConfig.editable?.data_source;
          const ds = (typeof dsConfig === "string"
            ? {
              table: dsConfig.split(".")[0],
              value_column: undefined,
              label_column: undefined,
            }
            : dsConfig) as
            | {
              table: string;
              value_column?: string;
              label_column?: string;
            }
            | undefined;
          if (!ds) return;
          const table = ds.table;
          const valueCol = ds.value_column || `${table}_id` || "id";
          const labelCol = ds.label_column || "name";

          promises.push(
            (async () => {
              try {
                const response = await fetchDataViaAthena({
                  table_name: table,
                  schema: "public",
                  conditions: [
                    {
                      eq_column: valueCol,
                      eq_value: value as string | number | boolean | null,
                    },
                  ],
                  limit: 1,
                });

                if (!response.error && response.data) {
                  const rows = Array.isArray(response.data)
                    ? response.data
                    : [];
                  if (rows.length > 0) {
                    const row = rows[0] as Record<string, unknown>;
                    labelMap.set(key, String(row[labelCol] || value));
                  }
                }
              } catch (e) {
                console.error("Failed to fetch label", e);
              }
            })(),
          );
        }
      });

      await Promise.all(promises);
      setDataSourceLabels(labelMap);
    };

    fetchLabels();
  }, [data, resource, user?.user_id, user?.organization_id]);

  // Build fields for entity renderer using the column registry (reuse table formatting)
  const fields = useMemo<DrilldownField[]>(() => {
    const row = data || {};
    const configured = resource?.columns;

    const hrefByKey = new Map<string, string>();
    if (Array.isArray(configured)) {
      configured.forEach((c) => {
        if (
          typeof c === "object" &&
          (c as ColumnConfigObject)?.column_name
        ) {
          const hrefValue = (c as { href?: unknown }).href;
          if (typeof hrefValue !== "string" || hrefValue.length === 0) {
            return;
          }
          hrefByKey.set(
            String((c as ColumnConfigObject).column_name),
            String((c as ColumnConfigObject).href),
          );
        }
      });
    }

    const specs: Array<LeanColumnSpec<ResourceData>> = (
      configured
        ? configured
          .filter(
            (c) =>
              !(typeof c === "object" && (c as ColumnConfigObject)?.hidden),
          )
          .map((c) =>
            typeof c === "string" ? { key: c, header: c.replace(/_/g, " ") } : {
              key: (c as ColumnConfigObject).column_name,
              header: (c as ColumnConfigObject).header_label ||
                (c as ColumnConfigObject).header ||
                (c as ColumnConfigObject).column_name.replace(/_/g, " "),
              use: (c as ColumnConfigObject).use,
              label: (c as ColumnConfigObject).label,
              href: (c as ColumnConfigObject).href,
              cell_value_mask_label: (c as ColumnConfigObject)
                .cell_value_mask_label,
              order: (c as ColumnConfigObject).order,
              formatter: (c as ColumnConfigObject).formatter,
              minWidth: (c as ColumnConfigObject).minWidth,
              widthFit: (c as ColumnConfigObject).widthFit,
            }
          )
        : Object.keys(row).map((k) => ({
          key: k,
          header: k.replace(/_/g, " "),
        }))
    ) as Array<LeanColumnSpec<ResourceData>>;

    const colDefs = buildColumnsFromRegistry<ResourceData>(specs);
    const colByKey = new Map<string, unknown>();
    for (const col of colDefs) {
      const colWithAccessor = col as { accessorKey?: string; id?: string };
      const key = colWithAccessor.accessorKey || colWithAccessor.id;
      if (key) colByKey.set(key, col);
    }

    return specs.map((s) => {
      const key = (typeof s === "object" ? s.key : s) as string;
      const fallbackLabel = (typeof s === "object" ? s.header : undefined) ||
        String(key).replace(/_/g, " ");
      const col = colByKey.get(String(key));
      const headerFromMeta = (col as { meta?: { headerText?: string } })?.meta
        ?.headerText;
      const headerFromCol =
        typeof (col as { header?: unknown })?.header === "string"
          ? (col as { header: string }).header
          : undefined;
      const label = headerFromMeta || headerFromCol || fallbackLabel;
      const editable = typeof s === "object"
        ? (s as { editable?: EditorConfig })?.editable
        : undefined;

      return {
        key: String(key),
        label: String(label),
        href: hrefByKey.get(String(key)),
        render: () => {
          try {
            if (col && typeof (col as { cell?: unknown }).cell === "function") {
              return (
                col as {
                  cell: (ctx: { row: { original: ResourceData } }) => ReactNode;
                }
              ).cell({ row: { original: row } });
            }
          } catch {}
          const value = row[key];

          if (editable) {
            const EditableField = () => {
              const { notification } = useNotification();
              const updateTable = editable?.update_table || resource?.table;
              const updateIdColumn = editable.update_id_column ||
                resource?.idColumn;
              const updateColumn = editable?.update_column || key;

              const { update, isLoading } = useUpdateData({
                table: updateTable || "",
                column: updateIdColumn || "",
                id: String(resource_id),
                updateBody: {},
                config: {
                  onSuccess: () =>
                    notification({
                      message: "Updated successfully",
                      success: true,
                    }),
                  onError: () =>
                    notification({ message: "Update failed", success: false }),
                },
              });

              if (
                editable.type === "select" &&
                Array.isArray(editable.options)
              ) {
                return (
                  <select
                    className="min-w-45 rounded-sm border bg-background px-2 py-1 text-sm"
                    disabled={isLoading}
                    value={String(row[key] ?? "")}
                    onChange={async (e) => {
                      const nextVal = e.target.value;
                      await update({ [updateColumn]: nextVal });
                    }}
                  >
                    {editable.options.map((opt) => (
                      <option key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                );
              }

              if (editable.type === "boolean") {
                const checked = Boolean(row[key]);
                return (
                  <div className="inline-flex items-center gap-2 text-sm">
                    <Switch
                      checked={checked}
                      disabled={isLoading}
                      onCheckedChange={async (val) => {
                        await update({ [updateColumn]: val });
                      }}
                    />
                    <span className="text-primary">
                      {checked ? "Yes" : "No"}
                    </span>
                  </div>
                );
              }

              return (
                <Input
                  className="h-8 max-w-65"
                  defaultValue={row[key] == null ? "" : String(row[key])}
                  onBlur={async (e: React.FocusEvent<HTMLInputElement>) => {
                    const nextVal = e.currentTarget.value;
                    if (nextVal !== String(row[key] ?? "")) {
                      await update({ [updateColumn]: nextVal });
                    }
                  }}
                />
              );
            };

            return <EditableField />;
          }
          const colConfig = configured?.find(
            (c) =>
              (typeof c === "object"
                ? (c as ColumnConfigObject).column_name
                : c) === key,
          );

          if (
            colConfig &&
            typeof colConfig === "object" &&
            (colConfig as ColumnConfigObject).editable?.data_source &&
            value
          ) {
            const label = dataSourceLabels.get(key);
            if (label) return label;
          }

          return value == null ? "-" : String(value);
        },
      };
    });
  }, [
    data,
    resource?.columns,
    dataSourceLabels,
    resource?.table,
    resource?.idColumn,
    resource_id,
  ]);

  useEffect(() => {
    return undefined;
  }, [isLoading, resourceLoading]);

  // Set up edit button in header
  useEffect(() => {
    const enabled = resource?.edit?.enabled !== false;

    if (!enabled) {
      return;
    }

    const editAction = {
      id: "toggle-edit",
      label: "",
      icon: isEditing
        ? <X className="text-icon h-4 w-4 stroke-icon" />
        : <Pencil className="text-icon h-4 w-4 stroke-icon" />,
      onClick: () => {
        if (isEditing) {
          setIsEditing(false);
        } else {
          setIsEditing((v) => !v);
        }
      },
      variant: "icon_v2" as const,
      size: "icon-title" as const,
      disabled: isSaving,
    };

    setHeaderActions([editAction]);
  }, [
    resource?.edit?.enabled,
    resource?.edit?.scope,
    isEditing,
    isSaving,
    setHeaderActions,
    setIsEditing,
  ]);

  // Cleanup header actions on unmount
  useEffect(() => {
    return () => {
      clearContentStore();
    };
  }, [clearContentStore]);

  if (isError || !resource) {
    const errorTitle = !resource
      ? "resource not found"
      : "failed to load resource";
    const errorMessage = error ||
      (!resource_name
        ? "no resource identifier provided"
        : `could not load resource "${resource_name}"`);

    return (
      <ErrorBlock
        fullPage
        type="error"
        title={errorTitle}
        content={errorMessage}
        isError={true}
        setIsError={() => {}}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!isNewResource && !hasValidResourceId) {
    return (
      <ErrorBlock
        fullPage
        type="error"
        title="missing id"
        content="no resource id provided for drilldown"
        isError={true}
        setIsError={() => {}}
        onRetry={() => router.push(`/v2/${resource_name}`)}
      />
    );
  }

  const drilldownCfg = RESOURCE_DRILLDOWN_ROUTES?.[
    resource_name as keyof typeof RESOURCE_DRILLDOWN_ROUTES
  ];

  const autoHideEmptyColumns = Boolean(
    drilldownCfg?.autoHideEmptyColumns ??
      resource?.drilldown?.autoHideEmptyColumns,
  );

  const drilldownTitle = getDrilldownTitle({
    drilldownTitle: drilldownCfg?.title,
    data: data ?? null,
    resourceLabel: resource?.page_label,
    resourceName: resource_name,
  });
  const drilldownSubtitle = drilldownCfg?.subtitle
    ? drilldownCfg.subtitle(data || {})
    : undefined;
  const drilldownIcon = useMemo(() => {
    const iconConfig = drilldownCfg?.titleIcon;
    if (!iconConfig) return undefined;
    if (typeof iconConfig === "function") {
      return iconConfig(data || {});
    }
    return iconConfig;
  }, [data, drilldownCfg?.titleIcon]);

  useEffect(() => {
    const deferToHeader = drilldownCfg?.deferToHeader ?? false;
    const deferTitle = drilldownCfg?.deferTitleToHeader ?? deferToHeader;
    const deferSubtitle =
      drilldownCfg?.deferSubtitleToHeader ?? deferToHeader;
    const deferTitleIcon =
      drilldownCfg?.deferTitleIconToHeader ?? deferTitle;

    if (deferTitle) {
      const titleText =
        typeof drilldownTitle === "string" ||
        typeof drilldownTitle === "number"
          ? String(drilldownTitle)
          : "";
      setTitle(titleText);
    }

    if (deferSubtitle) {
      setSubtitle(drilldownSubtitle ?? "");
    }

    if (deferTitleIcon) {
      setTitleIcon(drilldownIcon);
    } else {
      setTitleIcon(undefined);
    }
  }, [
    drilldownCfg?.deferSubtitleToHeader,
    drilldownCfg?.deferTitleToHeader,
    drilldownCfg?.deferToHeader,
    drilldownCfg?.deferTitleIconToHeader,
    drilldownSubtitle,
    drilldownTitle,
    drilldownIcon,
    setSubtitle,
    setTitle,
    setTitleIcon,
  ]);

  return (
    <div
      id="resource-drilldown-root"
      className="mx-auto w-full space-y-5 sm:max-w-7xl sm:px-0"
    >
      <UnsavedChanges
        open={isEditing && pendingChangesCount > 0}
        isSaving={isSaving}
        success={saveSuccess}
        error={saveError}
        onReset={handleResetChanges}
        onSave={handleSaveCallback}
        label={`${pendingChangesCount} ${
          pendingChangesCount === 1 ? "change" : "changes"
        } pending`}
        position="bottom"
        changes={pendingChangesList}
      />
      <DrilldownLayout
        title={drilldownTitle}
        subtitle={drilldownSubtitle}
        avatarUrl={(() => {
          try {
            const key = resource?.avatar_column;
            if (key && data && data[key]) {
              return String(data[key]);
            }
          } catch {}
          return undefined;
        })()}
        iconName={resource?.icon}
        paddingBottom={drilldownCfg?.paddingBottom}
        actions={
          <div
            id="resource-drilldown-actions"
            className="flex items-center gap-2 pr-4"
          >
            {Array.isArray(drilldownCfg?.actions) &&
              drilldownCfg!.actions!.length > 0 && (
              <ResponsiveDropdownV2
                dropdownLabel="Actions"
                items={drilldownCfg!.actions!.map((a) =>
                  (a as { type?: string })?.type === "separator"
                    ? { type: "separator" }
                    : {
                      buttonText: (a as { label: string }).label,
                      onClick: () =>
                        (
                          a as { onClick: (data: ResourceData) => void }
                        ).onClick?.(data || {}),
                      variant: (a as { destructive?: boolean }).destructive
                        ? "destructive"
                        : "default",
                      disabled:
                        typeof (a as { disabled?: unknown }).disabled ===
                            "function"
                          ? Boolean(
                            (
                              a as {
                                disabled: (data: ResourceData) => boolean;
                              }
                            ).disabled(data || {}),
                          )
                          : Boolean((a as { disabled?: boolean }).disabled),
                    }
                )}
              />
            )}
            {view?.debug_mode === true && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-sm"
                onClick={() => setShowJson(true)}
              >
                <Code2 className="stroke-icon h-5 w-5" />
              </Button>
            )}
          </div>
        }
        main={(() => {
          try {
            const Comp = resource?.drilldownCustomComponent;
            if (!Comp) return undefined;
            return (
              <div
                id="resource-drilldown-custom-component"
                className="px-4 sm:px-0"
              >
                {React.isValidElement(Comp) ? Comp : (
                  <Comp
                    resourceId={String(resource_id)}
                    resource={resource}
                  />
                )}
              </div>
            );
          } catch {
            return undefined;
          }
        })()}
      >
        <ResponsiveDialog
          isOpen={showJson}
          onClose={() => setShowJson(false)}
          title="Raw JSON"
          disableMaxWidth={true}
          className="max-w-175"
        >
          <div
            id="resource-drilldown-json-body"
            className="max-h-[70vh] overflow-auto"
          >
            <JsonBlock data={data ?? {}} />
          </div>
        </ResponsiveDialog>

        {isEditing
          ? (
            (() => {
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
                  const inferredEditorType = getDrizzleEditorType(
                    drizzleTableName,
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
                                  <SelectValue placeholder="Select" />
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
            })()
          )
          : Array.isArray(drilldownCfg?.sections) &&
              drilldownCfg!.sections!.length > 0
          ? (
            drilldownCfg!.sections!.map((section, idx: number) => {
              const sectionFields = (section.fields || []).map((f) => {
                const key = typeof f === "string"
                  ? f
                  : (f as { key: string }).key;
                const base = fields.find((ff) => ff.key === key);
                const label =
                  (typeof f === "object" && (f as { label?: string }).label) ||
                  base?.label ||
                  String(key).replace(/_/g, " ");
                return {
                  key,
                  label,
                  hidden: typeof f === "object"
                    ? Boolean((f as { hidden?: boolean }).hidden)
                    : false,
                  render: base?.render,
                  href: base?.href,
                };
              });
              return (
                <React.Fragment key={`drilldown-section-${idx}`}>
                  <DrilldownEntityRenderer
                    entity={data || {}}
                    fields={sectionFields}
                    columns={section.columns || 2}
                    title={section.title}
                    isLoading={isLoading}
                    autoHideEmptyColumns={autoHideEmptyColumns}
                    exposeToEditState={section.expose_to_edit_state ?? false}
                    widgets={section.widgets}
                  />
                </React.Fragment>
              );
            })
          )
          : (
            <DrilldownEntityRenderer
              entity={data || {}}
              fields={fields}
              title={`${resource?.page_label || resource_name}`}
              isLoading={isLoading}
              autoHideEmptyColumns={autoHideEmptyColumns}
            />
          )}
      </DrilldownLayout>
    </div>
  );
};
