"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_CONFIG } from "@/lib/config";
import { useApiClient } from "../hooks/use-api-client";
import { useUserStore } from "@/lib/stores";
import { useNotification } from "@/hooks/use-notifications";
import { insertRow } from "../utils/insert";
import { defaultEditorByColumn } from "@/packages/resource-framework/constructors/column-registry";
import {
  getDrizzleColumnInfo,
} from "@/packages/resource-framework/utils/drizzle-editor";
import {
  ColumnConfig,
  type FieldEditorSpec,
  type FieldInputType,
  type FieldSpec,
  FieldValue,
  Primitive,
} from "@/packages/resource-framework/resource-types";
import { SpecDrivenDialog } from "./dialog";

const mapFieldTypeToEditorType = (
  fieldType?: FieldInputType,
): FieldEditorSpec["type"] | undefined => {
  if (!fieldType) return undefined;
  if (fieldType === "boolean") return "boolean";
  if (fieldType === "number") return "number";
  if (fieldType === "date") return "date";
  if (fieldType === "select") return "select";
  return "text";
};

const isUserDerivedDataSource = (
  dataSource: unknown,
): dataSource is `user.${string}` => {
  return typeof dataSource === "string" && dataSource.startsWith("user.");
};

const isUuidV4GenDataSource = (
  dataSource: unknown,
): dataSource is "uuid_v4_gen" => {
  return typeof dataSource === "string" && dataSource === "uuid_v4_gen";
};

const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
};

const isDbDataSource = (dataSource: unknown): boolean => {
  if (!dataSource) return false;
  if (typeof dataSource === "string") {
    if (isUserDerivedDataSource(dataSource)) return false;
    if (isUuidV4GenDataSource(dataSource)) return false;
    return dataSource.includes(".");
  }
  return Boolean(
    typeof dataSource === "object" &&
      "table" in (dataSource as Record<string, unknown>) &&
      Boolean((dataSource as Record<string, unknown>).table),
  );
};

const resolveUserDefaultValue = (
  spec: NormalizedFieldSpec,
  source: `user.${string}`,
  user: Record<string, unknown> | null | undefined,
): NormalizedFieldSpec => {
  const key = source.slice("user.".length);
  const value = user?.[key];
  if (value == null || value === "") {
    return { ...spec, hidden: true, default_value_source: source };
  }
  return {
    ...spec,
    hidden: true,
    default_value: String(value) as Primitive,
    default_value_source: source,
  };
};

const generateUuidV4 = () => {
  if (
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return template.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const buildFieldEditorSpec = (
  column: ColumnConfig,
  tableName?: string,
): FieldEditorSpec | undefined => {
  if (typeof column === "string") return undefined;
  const columnName = column.column_name;
  if (!columnName) return undefined;
  const info = getDrizzleColumnInfo(tableName, columnName);
  const editorConfig = column.editor;
  const fallbackEditor =
    defaultEditorByColumn[String(columnName).toLowerCase()] ??
      defaultEditorByColumn[columnName];
  const dataSource = editorConfig?.data_source;
  const options = editorConfig?.options ?? fallbackEditor?.options;
  const type = editorConfig?.type ??
    (isDbDataSource(dataSource) ? "select" : undefined) ??
    fallbackEditor?.type ??
    mapFieldTypeToEditorType(info.fieldType);
  if (!type) {
    if (isDbDataSource(dataSource)) {
      return { type: "select", data_source: dataSource };
    }
    return undefined;
  }
  return {
    type,
    options: Array.isArray(options) && options.length > 0 ? options : undefined,
    data_source: dataSource,
  };
};

type NormalizedFieldSpec = {
  column_name: string;
  header?: string;
  header_label?: string;
  hidden?: boolean;
  data_type?: string;
  default_value?: Primitive;
  editor?: FieldEditorSpec;
  default_value_source?: `user.${string}` | "uuid_v4_gen";
};

const mapColumnConfigToFieldSpec = (
  column: ColumnConfig,
  tableName?: string,
): NormalizedFieldSpec | null => {
  const buildSpec = (
    columnName: string,
    config?: ColumnConfig,
    editorSource?: ColumnConfig,
  ): NormalizedFieldSpec | null => {
    if (!columnName) return null;
    const info = getDrizzleColumnInfo(tableName, columnName);
    const configObject = config && typeof config !== "string"
      ? config
      : undefined;
    const editorObject = editorSource && typeof editorSource !== "string"
      ? editorSource
      : undefined;
    const configuredType = configObject?.data_type;

    return {
      column_name: columnName,
      header: configObject?.header,
      header_label: configObject?.header_label,
      hidden: Boolean(configObject?.hidden),
      data_type: info.dataType ?? configObject?.data_type ?? "string",
      default_value: configObject?.default_value,
      editor: editorObject
        ? buildFieldEditorSpec(editorObject, tableName)
        : undefined,
    };
  };

  if (typeof column === "string") {
    const columnName = column.trim();
    return buildSpec(columnName);
  }
  const columnName = column.column_name;
  return buildSpec(columnName, column, column);
};

export function CreateResourceDialog(props: {
  open: boolean;
  onCloseAction: () => void;
  required?: string[];
  optional?: string[];
  table?: string;
  onCreatedAction?: (createdRow: Record<string, unknown> | null) => void;
  /**
   * Error callback - called when create fails.
   */
  onCreateError?: (errorMessage: string) => void;
  /**
   * Optimistic action callback - called immediately with payload before API call.
   * Useful for optimistic UI updates.
   */
  onOptimisticAction?: (payload: Record<string, unknown>) => void;
  DialogComponent?: React.ComponentType<{
    onSubmit(values: Record<string, unknown>): void;
    onCancel(): void;
    initial?: Partial<Record<string, unknown>>;
    pending?: boolean;
  }>;
  columns?: Array<ColumnConfig>;
  title?: string;
  /**
   * Optional resource_name to fetch route config from DB when explicit props are not supplied.
   */
  resourceName?: string;
  /**
   * Control request caching headers for DB fetches.
   * When false (default), we send Cache-Control: no-cache
   */
  cacheEnabled?: boolean;
  /**
   * Provide default values that should be submitted even if not rendered as fields.
   * Useful for system/foreign key fields like customer_id.
   */
  defaultValues?: Partial<Record<string, FieldValue>>;
  useDataApi?: boolean;
}) {
  const {
    open,
    onCloseAction,
    required = [],
    optional = [],
    table,
    onCreatedAction,
    onCreateError,
    onOptimisticAction,
    DialogComponent,
    columns,
    title = "Create",
    resourceName,
    cacheEnabled = false,
    defaultValues = {},
    useDataApi = false,
  } = props;
  const { notification } = useNotification();
  const { user } = useUserStore();
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [loading, setLoading] = useState(false);

  // Derived config from DB when explicit config is not supplied
  const [derivedTable, setDerivedTable] = useState<string | undefined>(table);
  const [derivedRequired, setDerivedRequired] = useState<string[]>(
    Array.isArray(required) ? required : [],
  );
  const [derivedOptional, setDerivedOptional] = useState<string[]>(
    Array.isArray(optional) ? optional : [],
  );
  const [derivedColumns, setDerivedColumns] = useState<Array<ColumnConfig>>(
    Array.isArray(columns) ? columns : [],
  );

  const schemaTableForInference = derivedTable && derivedTable.trim().length > 0
    ? derivedTable
    : resourceName;
  const isNormalizedFieldSpec = (
    spec: FieldSpec | null,
  ): spec is NormalizedFieldSpec => {
    return Boolean(spec && typeof spec === "object" && "column_name" in spec);
  };

  const derivedColumnSpecs = useMemo<NormalizedFieldSpec[]>(() => {
    if (!Array.isArray(derivedColumns) || derivedColumns.length === 0) {
      return [];
    }
    return derivedColumns
      .map((column) =>
        mapColumnConfigToFieldSpec(column, schemaTableForInference)
      )
      .filter(isNormalizedFieldSpec);
  }, [derivedColumns, schemaTableForInference]);

  const effectiveColumnSpecs = useMemo<NormalizedFieldSpec[]>(() => {
    const userRecord = user as Record<string, unknown> | null | undefined;
    return derivedColumnSpecs.map((spec) => {
      const ds = spec.editor?.data_source;
      if (isUuidV4GenDataSource(ds)) {
        return { ...spec, hidden: true, default_value_source: "uuid_v4_gen" };
      }
      if (isUserDerivedDataSource(ds)) {
        return resolveUserDefaultValue(spec, ds, userRecord);
      }
      if (isUuidV4GenDataSource(spec.default_value)) {
        return { ...spec, hidden: true, default_value_source: "uuid_v4_gen" };
      }
      if (isUserDerivedDataSource(spec.default_value)) {
        return resolveUserDefaultValue(spec, spec.default_value, userRecord);
      }
      return spec;
    });
  }, [derivedColumnSpecs, user]);

  const effectiveColumnNames = useMemo(() => {
    const set = new Set<string>();
    effectiveColumnSpecs.forEach((spec) => {
      if (spec.column_name) set.add(spec.column_name);
    });
    return set;
  }, [effectiveColumnSpecs]);

  const derivedSpecMap = useMemo(() => {
    const map = new Map<string, FieldSpec>();
    effectiveColumnSpecs.forEach((spec) => {
      const key = spec.column_name;
      if (key) map.set(key, spec);
    });
    return map;
  }, [effectiveColumnSpecs]);

  const validDerivedRequired = useMemo(() => {
    if (!Array.isArray(derivedRequired) || derivedRequired.length === 0) {
      return [];
    }
    return derivedRequired.filter((key) => derivedSpecMap.has(key));
  }, [derivedRequired, derivedSpecMap]);

  const validDerivedOptional = useMemo(() => {
    if (!Array.isArray(derivedOptional) || derivedOptional.length === 0) {
      return [];
    }
    return derivedOptional.filter((key) => derivedSpecMap.has(key));
  }, [derivedOptional, derivedSpecMap]);

  useEffect(() => {
    setDerivedTable(table);
  }, [table]);
  useEffect(() => {
    if (Array.isArray(required) && required.length > 0) {
      setDerivedRequired(required);
    }
  }, [JSON.stringify(required)]);
  useEffect(() => {
    if (Array.isArray(optional) && optional.length > 0) {
      setDerivedOptional(optional);
    }
  }, [JSON.stringify(optional)]);
  useEffect(() => {
    setDerivedColumns(Array.isArray(columns) ? columns : []);
  }, [JSON.stringify(columns)]);

  // Load route config if needed via data hook
  const noExplicit = (!table || table.trim() === "") &&
    (!Array.isArray(required) || required.length === 0) &&
    (!Array.isArray(optional) || optional.length === 0) &&
    (!Array.isArray(columns) || columns.length === 0);

  const canFetchRoute = Boolean(
    open &&
      noExplicit &&
      resourceName &&
      user?.user_id &&
      user?.company_id &&
      user?.organization_id,
  );

  const routeByResourceResult = useApiClient<Record<string, unknown>>({
    table: "resource_routes",
    conditions: [
      { eq_column: "resource_name", eq_value: String(resourceName || "") },
    ],
    single: true,
    enabled: canFetchRoute,
    noCache: !cacheEnabled,
  });

  const routeByResource = "data" in routeByResourceResult
    ? routeByResourceResult.data
    : null;

  const routeByTableResult = useApiClient<Record<string, unknown>>({
    table: "resource_routes",
    conditions: [{ eq_column: "table", eq_value: String(resourceName || "") }],
    single: true,
    enabled: Boolean(canFetchRoute && !routeByResource),
    noCache: !cacheEnabled,
  });

  const routeByTable = "data" in routeByTableResult
    ? routeByTableResult.data
    : null;

  useEffect(() => {
    const row = routeByResource || routeByTable || null;
    if (!row) return;

    const toArray = (v: unknown): unknown[] =>
      Array.isArray(v) ? v : typeof v === "string" ? [v] : [];

    const mapColumns = (cols: unknown): ColumnConfig[] => {
      const arr = toArray(cols);
      return arr
        .map((c: unknown) =>
          typeof c === "string"
            ? { column_name: c }
            : c && typeof c === "object" &&
                (c as Record<string, unknown>).column_name
            ? (c as ColumnConfig)
            : null
        )
        .filter((item): item is ColumnConfig => item !== null);
    };

    setDerivedTable(
      (row as Record<string, unknown>)?.table as string || resourceName,
    );
    const req = toArray(
      (row as Record<string, unknown>)?.new_resource_mandatory_columns,
    ) as string[];
    const opt = toArray(
      (row as Record<string, unknown>)?.new_resource_optional_columns,
    ) as string[];
    setDerivedRequired(req);
    setDerivedOptional(opt);
    const cols = mapColumns((row as Record<string, unknown>)?.columns);
    setDerivedColumns(cols);
  }, [routeByResource, routeByTable, resourceName]);

  useEffect(() => {
    const shouldInfer = noExplicit && derivedColumnSpecs.length > 0;
    if (!shouldInfer) return;
    if (derivedRequired.length > 0 || derivedOptional.length > 0) return;
    if (!schemaTableForInference) return;

    const inferredRequired: string[] = [];
    const inferredOptional: string[] = [];
    effectiveColumnSpecs.forEach((spec) => {
      const key = spec.column_name;
      if (!key || spec.hidden) return;
      const info = getDrizzleColumnInfo(schemaTableForInference, key);
      if (info.isNullable === false) {
        inferredRequired.push(key);
      } else {
        inferredOptional.push(key);
      }
    });

    if (inferredRequired.length === 0 && inferredOptional.length === 0) return;
    setDerivedRequired(inferredRequired);
    setDerivedOptional(inferredOptional);
  }, [
    noExplicit,
    derivedColumnSpecs,
    effectiveColumnSpecs,
    derivedRequired,
    derivedOptional,
    schemaTableForInference,
  ]);

  // Initialize values on open based on required/optional/columns (explicit or derived)
  useEffect(() => {
    if (open) {
      const init: Record<string, FieldValue> = {};

      // Always seed required/optional keys
      const seedRequired = (derivedRequired || []).filter((k) =>
        effectiveColumnNames.has(k)
      );
      seedRequired.forEach((k) => {
        init[k] = "";
      });
      const seedOptional = (derivedOptional || []).filter((k) =>
        effectiveColumnNames.has(k)
      );
      seedOptional.forEach((k) => {
        if (init[k] == null) init[k] = "";
      });

      // If using column-driven spec, include ALL columns (including hidden) so defaults can flow through
      const hasExplicitFields =
        (Array.isArray(derivedRequired) && derivedRequired.length > 0) ||
        (Array.isArray(derivedOptional) && derivedOptional.length > 0);
      if (!hasExplicitFields) {
        effectiveColumnSpecs.forEach((spec) => {
          const key = spec.column_name;
          if (!key) return;
          if (init[key] == null) init[key] = "";
        });
      }

      // Overlay default values from columns (default_value) and from prop defaultValues
      effectiveColumnSpecs.forEach((spec) => {
        const key = spec.column_name;
        if (!key) return;
        if (Object.prototype.hasOwnProperty.call(spec, "default_value")) {
          init[key] = spec.default_value as FieldValue;
        }
      });

      // Auto-generate UUID v4 values for uuid_v4_gen fields
      effectiveColumnSpecs.forEach((spec) => {
        const key = spec.column_name;
        if (!key) return;
        const needsUuidDefault =
          isUuidV4GenDataSource(spec.editor?.data_source) ||
          spec.default_value_source === "uuid_v4_gen" ||
          isUuidV4GenDataSource(spec.default_value);
        if (!needsUuidDefault) return;
        const current = init[key];
        if (
          current == null ||
          String(current).trim() === "" ||
          isUuidV4GenDataSource(current)
        ) {
          init[key] = generateUuidV4();
        }
      });
      Object.entries(defaultValues || {}).forEach(([k, v]) => {
        init[k] = v as FieldValue;
      });

      setValues(init);
    }
  }, [
    open,
    JSON.stringify(derivedRequired),
    JSON.stringify(derivedOptional),
    JSON.stringify(derivedColumns),
    JSON.stringify(defaultValues),
    derivedColumnSpecs,
    effectiveColumnSpecs,
    user?.user_id,
    user?.company_id,
    user?.organization_id,
  ]);

  async function handleSubmit(payload?: Record<string, unknown>) {
    try {
      // Merge defaults with user payload/values. Explicit payload overrides defaults.
      const mergedDefaults: Record<string, unknown> = {};
      effectiveColumnSpecs.forEach((spec) => {
        const key = spec.column_name;
        if (!key) return;
        if (Object.prototype.hasOwnProperty.call(spec, "default_value")) {
          mergedDefaults[key] = spec.default_value as unknown;
        }
      });
      Object.assign(mergedDefaults, defaultValues || {});
      const base = payload ?? values;
      const source = { ...mergedDefaults, ...base };
      const userRecord = user as Record<string, unknown> | null | undefined;
      const resolvedSource: Record<string, unknown> = { ...source };

      effectiveColumnSpecs.forEach((spec) => {
        const key = spec.column_name;
        if (!key) return;
        const hasUuidDefault =
          isUuidV4GenDataSource(spec.editor?.data_source) ||
          spec.default_value_source === "uuid_v4_gen" ||
          isUuidV4GenDataSource(spec.default_value);
        if (hasUuidDefault) {
          const current = resolvedSource[key];
          if (
            current == null ||
            String(current).trim() === "" ||
            isUuidV4GenDataSource(current)
          ) {
            resolvedSource[key] = generateUuidV4();
          }
        }

        const userSource = (() => {
          if (isUserDerivedDataSource(spec.editor?.data_source)) {
            return spec.editor?.data_source;
          }
          if (
            spec.default_value_source &&
            isUserDerivedDataSource(spec.default_value_source)
          ) {
            return spec.default_value_source;
          }
          if (isUserDerivedDataSource(spec.default_value)) {
            return spec.default_value;
          }
          return undefined;
        })();
        if (userSource) {
          const userKey = userSource.slice("user.".length);
          const userValue = userRecord?.[userKey];
          if (userValue != null && userValue !== "") {
            resolvedSource[key] = String(userValue);
          }
        }
      });
      const missing = validDerivedRequired.filter((k) => {
        const v = resolvedSource[k];
        return v == null || String(v).trim() === "";
      });
      if (missing.length > 0) {
        notification({
          message: "Please complete required fields",
          success: false,
        });
        return;
      }
      if (!derivedTable || String(derivedTable).trim() === "") {
        notification({
          message: "Unknown target table",
          success: false,
        });
        return;
      }
      setLoading(true);
      // When using DialogComponent, we trust the payload directly and merge with defaultValues
      // because the custom component handles its own validation and data structure
      const body: Record<string, unknown> = {};

      if (DialogComponent && payload) {
        // For custom DialogComponent, merge payload with defaultValues, then filter
        // Normalize defaultValues keys (snake_case -> camelCase) to match Drizzle schema
        const normalizedDefaults: Record<string, unknown> = {};
        Object.entries(defaultValues || {}).forEach(([k, v]) => {
          const camelKey = snakeToCamel(k);
          normalizedDefaults[camelKey] = v;
        });
        const mergedPayload = { ...normalizedDefaults, ...payload };

        Object.entries(mergedPayload).forEach(([k, v]) => {
          // Skip empty strings and undefined, but keep null values
          if (v === "" || v === undefined) {
            return;
          }
          body[k] = v as unknown;
        });
      } else {
        // For standard form, filter by effectiveColumnSpecs
        Object.entries(resolvedSource).forEach(([k, v]) => {
          // Skip empty strings and undefined, but keep null values
          if (v === "" || v === undefined) {
            return;
          }
          // Keep null values - they're needed for JSONB fields
          // For JSONB fields, ensure they're proper objects/arrays, not strings
          if (
            v !== null && typeof v === "object" && !Array.isArray(v) &&
            !(v instanceof Date)
          ) {
            // Already an object, keep as is
            body[k] = v;
          } else {
            body[k] = v as unknown;
          }
        });
      }

      // Call optimistic action before API call for immediate UI update
      if (onOptimisticAction) {
        try {
          onOptimisticAction(body);
        } catch (error) {
          console.warn("Optimistic action failed:", error);
          // Continue with API call even if optimistic action fails
        }
      }

      const result = useDataApi
        ? await insertRowViaDataApi(derivedTable, body, user)
        : await insertRow(derivedTable, body);
      if (!result.ok) {
        const errorMsg = ("error" in result && typeof result.error === "string"
          ? result.error
          : null) || "Could not create – try again";
        console.error("Insert failed:", errorMsg, {
          table: derivedTable,
          body,
          result,
        });

        // Note: Optimistic action was already called, but we can't rollback here
        // The component using onOptimisticAction should handle rollback if needed
        // by storing previous state and restoring it on error
        if (onCreateError) {
          onCreateError(errorMsg);
        }

        notification({
          message: errorMsg,
          success: false,
        });
        return;
      }
      const j = (result.data || {}) as { data?: unknown };
      // Only show generic notification if onCreatedAction is not provided
      // (onCreatedAction should handle its own notification)
      if (!onCreatedAction) {
        notification({ message: "Created successfully", success: true });
      }
      onCloseAction?.();
      const row = (j?.data && Array.isArray(j.data) ? j.data[0] : j?.data) ||
        null;
      onCreatedAction?.(row as Record<string, unknown> | null);
    } catch {
      notification({
        message: "Could not create – try again",
        success: false,
      });
    } finally {
      setLoading(false);
    }
  }

  // Compute spec before any early returns to satisfy React Hooks rules
  const spec: FieldSpec[] = useMemo(() => {
    const hasExplicitFields = validDerivedRequired.length > 0 ||
      validDerivedOptional.length > 0;

    if (hasExplicitFields) {
      return [...validDerivedRequired, ...validDerivedOptional]
        .map((key) => derivedSpecMap.get(key))
        .filter((item): item is FieldSpec => Boolean(item));
    }

    return effectiveColumnSpecs;
  }, [
    effectiveColumnSpecs,
    derivedSpecMap,
    validDerivedOptional,
    validDerivedRequired,
  ]);

  // Render a completely custom dialog form when provided
  if (DialogComponent) {
    return (
      <Dialog
        open={open}
        onOpenChange={(isOpen) => !isOpen && onCloseAction()}
      >
        <DialogContent
          className={title
            ? "max-w-155"
            : "max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-background"}
        >
          <DialogHeader className={title ? undefined : "sr-only"}>
            <DialogTitle>{title || "Create"}</DialogTitle>
          </DialogHeader>
          <DialogComponent
            onSubmit={(vals) => {
              void handleSubmit(vals as Record<string, unknown>);
            }}
            onCancel={onCloseAction}
            initial={values}
            pending={loading}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <SpecDrivenDialog
      open={open}
      onCloseAction={onCloseAction}
      title={title}
      spec={spec}
      requiredKeys={validDerivedRequired}
      initial={values}
      pending={loading}
      submitLabel="Create"
      cancelLabel="Cancel"
      onSubmit={(vals: Record<string, unknown>) => void handleSubmit(vals)}
      stripEmpty
      cacheEnabled={cacheEnabled}
    />
  );
}

async function insertRowViaDataApi(
  table: string,
  insertBody: Record<string, unknown>,
  user?: {
    company_id?: string | null;
    organization_id?: string | null;
    user_id?: string | null;
  },
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Athena-Client": "railway_direct",
  };
  if (user?.company_id) headers["X-Company-Id"] = user.company_id;
  if (user?.organization_id) {
    headers["X-Organization-Id"] = user.organization_id;
  }
  if (user?.user_id) headers["X-User-Id"] = user.user_id;

  try {
    const requestBody = {
      table_name: table,
      insert_body: insertBody,
    };

    const response = await fetch(`${APP_CONFIG.api.suitsbooks}/data/insert`, {
      method: "PUT",
      headers,
      body: JSON.stringify(requestBody),
    });

    let payload: { error?: string; data?: unknown; message?: string } = {};
    let responseText = "";
    try {
      responseText = await response.text();
      if (responseText) {
        try {
          payload = JSON.parse(responseText) as typeof payload;
        } catch (parseError) {
          console.error(
            "Failed to parse JSON response:",
            parseError,
            "Response text:",
            responseText,
          );
          // If response is not JSON, use the text as error message
          payload = {
            error: responseText ||
              `HTTP ${response.status}: ${response.statusText}`,
          };
        }
      }
    } catch (textError) {
      console.error("Failed to read response text:", textError);
      payload = {
        error: `Failed to read server response: ${response.statusText}`,
      };
    }

    if (!response.ok) {
      const errorMsg = payload?.error || payload?.message || responseText ||
        `HTTP ${response.status}: ${response.statusText}`;
      console.error("Data API insert failed:", errorMsg, {
        payload,
        responseText,
        status: response.status,
        statusText: response.statusText,
        requestBody: JSON.stringify(requestBody, null, 2),
        requestBodyKeys: Object.keys(requestBody),
        insertBodyKeys: Object.keys(insertBody),
        insertBodySample: Object.fromEntries(
          Object.entries(insertBody).slice(0, 5).map(([k, v]) => [
            k,
            typeof v === "object"
              ? JSON.stringify(v).substring(0, 100)
              : String(v).substring(0, 100),
          ]),
        ),
      });
      return { ok: false, error: errorMsg };
    }

    if (payload.error) {
      console.error("Data API returned error:", payload.error, { payload });
      return { ok: false, error: payload.error };
    }

    return { ok: true, data: payload.data };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Failed to insert via data API", error);
    return { ok: false, error: errorMsg };
  }
}
