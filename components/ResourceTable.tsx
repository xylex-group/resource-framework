"use client";

import { ResourceError } from "./ui/resource-error";
import { AthenaResourceTable } from "./table/athena-resource-table";
import { useApiClient } from "../hooks/use-api-client";
import {
  useBackButtonStore,
  useContentStore,
  useUserStore,
  useViewStore,
} from "@/lib/stores";
import { cn } from "@/lib/utils";
import { prettyString } from "@/lib/format/string";
import { useNotification } from "@/hooks/use-notifications";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableColumnMeta, TableRowData } from "../resource-types";
import { useUserScopes } from "../hooks/useUserScopes";
import { useResourceRoute } from "../hooks/useResourceRoute";
import { useAdvancedFilters } from "../hooks/useAdvancedFilters";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useTableConfiguration } from "../hooks/useTableConfiguration";
import { parseQueryFilters, parseQuerySort } from "../utils/query-parser";
import { applyClientFilters } from "../utils/client-filter";
import { buildResourceConditions } from "../utils/resource-conditions";
import { generateDisplayConfig } from "../utils/display-config";
import { buildTableColumns } from "../utils/column-builder";
import { getValueByKeyCase, getValueByPathCase } from "../utils/key-case";
import { createActionsColumn } from "./table/ActionsColumn";
import { useAddResourceButton } from "./table/AddResourceButton";
import { CreateResourceDialog } from "./create-resource-dialog";
import { Plus } from "lucide-react";

const parseSearchByColumns = (value?: string): string[] => {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
};

type FilterFieldType = "text" | "number" | "date" | "boolean";
type FilterFieldDefinition = {
  key: string;
  label: string;
  type: FilterFieldType;
};

type ColumnKeyDef = ColumnDef<TableRowData> & {
  accessorKey?: string;
  id?: string;
  meta?: TableColumnMeta;
};

const getColumnIdentifier = (column: ColumnDef<TableRowData>): string | undefined => {
  const colDef = column as ColumnKeyDef;
  if (typeof colDef.accessorKey === "string" && colDef.accessorKey.trim()) {
    return colDef.accessorKey;
  }
  if (typeof colDef.id === "string" && colDef.id.trim()) {
    return colDef.id;
  }
  const columnName = colDef.meta?.column_name;
  if (typeof columnName === "string" && columnName.trim()) {
    return columnName;
  }
  return undefined;
};

const resolveSearchColumnIdentifier = (
  columns: ColumnDef<TableRowData>[],
  target: string,
): string | undefined => {
  const needle = target.toLowerCase();
  for (const column of columns) {
    const identifier = getColumnIdentifier(column);
    if (!identifier) continue;
    if (identifier.toLowerCase() === needle) {
      return identifier;
    }
    const columnName = (column as ColumnKeyDef).meta?.column_name;
    if (typeof columnName === "string" && columnName.toLowerCase() === needle) {
      return identifier;
    }
  }
  return undefined;
};

const inferFilterTypeFromDatatype = (datatype?: string): FilterFieldType => {
  const normalized = String(datatype || "").toLowerCase();
  if (normalized.includes("bool")) return "boolean";
  if (
    normalized.includes("num") ||
    normalized.includes("int") ||
    normalized.includes("decimal") ||
    normalized.includes("currency")
  ) {
    return "number";
  }
  if (normalized.includes("date") || normalized.includes("time")) return "date";
  return "text";
};

const toFilterFieldDefinition = (
  column: ColumnDef<TableRowData>,
): FilterFieldDefinition | null => {
  const col = column as ColumnDef<TableRowData> & {
    accessorKey?: string;
    id?: string;
    header?: unknown;
    meta?: TableColumnMeta;
  };
  const key = col.accessorKey ?? col.id;
  if (!key) return null;

  const meta = col.meta || {};
  const label =
    (typeof meta.headerText === "string" && meta.headerText) ||
    (typeof col.header === "string" ? col.header : prettyString(String(key)));

  return {
    key,
    label,
    type: inferFilterTypeFromDatatype(meta.datatype),
  };
};

/**
 * Main table component for displaying resource data with filtering, sorting, and pagination
 * @param props - Component props including optional resourceName
 * @returns React component
 */
export const ResourceTable = ({
  resourceName,
  initialData,
  createAction,
}: {
  resourceName?: string;
  initialData?: TableRowData[];
  createAction?: (
    payload: Record<string, unknown>,
  ) => Promise<TableRowData>;
}) => {
  const params = useParams<{ resource_name: string }>();
  const resource_name = resourceName ?? params?.resource_name;
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  const { view, setDisplaySetting } = useViewStore();
  const { clear: clearBackButton } = useBackButtonStore();
  const {
    setHeaderActions,
    setTitle,
    setSubtitle,
    clear: clearContentStore,
  } = useContentStore();
  const router = useRouter();
  const { notification } = useNotification();
  const { hasScope } = useUserScopes({ cache_enabled: true });
  const [createOpen, setCreateOpen] = useState(false);
  const [localInitialData, setLocalInitialData] = useState(initialData);
  const cacheExperimental = hasScope("xbp_cache_experimental_v2");

  const { resource, resourceLoading } = useResourceRoute(
    resource_name,
    user || null
  );
  const contextSettings =
    (view?.display_settings || {})[`v2_${resource_name}`] || {};
  const {
    displayContext,
    limit,
    noCache,
    columns: apiColumns,
  } = useTableConfiguration(
    resource_name,
    resource,
    contextSettings,
    cacheExperimental
  );

  useEffect(() => {
    try {
      const sidebarRoute = resource?.sidebar_route;
      if (sidebarRoute) {
        setDisplaySetting?.("__noop__", "__noop__", null);
        window.requestAnimationFrame?.(() => {
          try {
            useViewStore.getState()?.setSidebarRoute?.(sidebarRoute);
          } catch {}
        });
      } else {
        useViewStore.getState()?.setSidebarRoute?.(null);
      }
    } catch {}
  }, [resource_name, resource]);

  useEffect(() => {
    try {
      if (resource?.force_remove_back_button_store_on_index_resource) {
        clearBackButton?.();
      }
    } catch {}
  }, [
    resource?.table,
    resource?.force_remove_back_button_store_on_index_resource,
    clearBackButton,
  ]);

  const conditions = useMemo(
    () => buildResourceConditions(resource, user?.company_id, resource_name),
    [resource, user?.company_id, resource_name]
  );

  const querySort = useMemo(() => parseQuerySort(searchParams), [searchParams]);

  const queryFilters = useMemo(() => {
    const filterableMeta =
      typeof window !== "undefined" ? window.__filterableMeta : undefined;
    return parseQueryFilters(searchParams, filterableMeta);
  }, [searchParams]);

  const effectiveLimit = useMemo(() => {
    if (limit < 1000) {
      return 10000;
    }
    return limit;
  }, [limit]);

  const apiResult = useApiClient<TableRowData>({
    table: resource?.table || "",
    schema: resource?.schema || "public",
    conditions,
    columns: apiColumns,
    enabled: initialData === undefined && Boolean(
      resource?.table &&
      user?.user_id &&
      user?.organization_id &&
      user?.company_id
    ),
    noCache,
    limit: effectiveLimit,
  });

  const apiData = "data" in apiResult ? apiResult.data : null;
  useEffect(() => {
    setLocalInitialData(initialData);
  }, [initialData]);

  const data = localInitialData ?? apiData;
  const isError = initialData === undefined &&
    ("isError" in apiResult ? apiResult.isError : false);
  const error = "error" in apiResult ? apiResult.error : null;
  const isLoading = initialData === undefined &&
    ("isLoading" in apiResult ? Boolean(apiResult.isLoading) : false);

  // Flatten data if it's nested arrays
  const flatData = useMemo(() => {
    if (!data) return undefined;
    if (!Array.isArray(data)) return undefined;
    return data as TableRowData[];
  }, [data]);

  const columns = useMemo(() => {
    const built = buildTableColumns(flatData, resource);
    built.push(createActionsColumn(resource, resource_name));
    return built;
  }, [flatData, resource, resource_name]);

  const filterFields = useMemo(() => {
    try {
      const asArray = Array.isArray(columns) ? columns : [];
      return asArray
        .map(toFilterFieldDefinition)
        .filter((item): item is FilterFieldDefinition => item !== null);
    } catch {
      return [];
    }
  }, [columns]);

  const { advFilters: _advFilters, handleAdvFiltersChange: _handleAdvFiltersChange } = useAdvancedFilters(
    searchParams,
    filterFields
  );

  const filteredData = useMemo(
    () => applyClientFilters(flatData || [], queryFilters),
    [flatData, queryFilters]
  );

  const parsedSearchBy = useMemo(
    () => parseSearchByColumns(resource?.searchBy),
    [resource?.searchBy],
  );

  const searchColumnIds = useMemo(() => {
    if (!parsedSearchBy.length || columns.length === 0) {
      return [];
    }
    const matches: string[] = [];
    const seen = new Set<string>();
    for (const candidate of parsedSearchBy) {
      const resolved = resolveSearchColumnIdentifier(columns, candidate);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        matches.push(resolved);
      }
    }
    return matches;
  }, [columns, parsedSearchBy]);

  // Organization validation: redirect if data belongs to different organization
  useEffect(() => {
    if (user?.organization_id && flatData && Array.isArray(flatData)) {
      // Check if any data belongs to different org
      const hasWrongOrgData = flatData.some(
        (item: TableRowData) =>
          item.organization_id && item.organization_id !== user.organization_id
      );

      if (hasWrongOrgData) {
        // Redirect to home if data belongs to wrong organization
        router.push("/");
      }
    }
  }, [user?.organization_id, flatData, router]);

  const displayConfig = useMemo(
    () => generateDisplayConfig(columns as ColumnDef<TableRowData>[]),
    [columns]
  );

  useUserPreferences(
    user || null,
    resource,
    displayContext,
    contextSettings,
    setDisplaySetting as (context: string, key: string, value: unknown) => void
  );

  useEffect(() => {
    if (querySort) {
      try {
        const val = `${querySort.id}_${querySort.desc ? "desc" : "asc"}`;
        setDisplaySetting?.(displayContext, "sort_by", val);
      } catch {}
    }
  }, [querySort?.id, querySort?.desc, displayContext, setDisplaySetting]);

  const { addResourceProps, createCfg, canSeeCreate, canCreate } =
    useAddResourceButton(
      resource_name,
      resource,
      user
        ? {
            user_id: user.user_id || "",
            company_id: user.company_id || "",
            organization_id: user.organization_id || "",
          }
        : null,
      hasScope,
      notification,
      setCreateOpen
    );
  const createColumns = Array.isArray(createCfg?.columns)
    ? createCfg.columns
    : Array.isArray(resource?.columns)
      ? resource.columns
      : [];
  const prevResourceRef = useRef<typeof resource>(undefined);
  const prevResourceNameRef = useRef<string>(undefined);
  const searchEnabled = resource?.enableSearch !== false;
  const firstColumnIdentifier =
    columns.length > 0 ? getColumnIdentifier(columns[0]) : undefined;
  const primaryFilterColumn = searchEnabled
    ? searchColumnIds[0] ?? firstColumnIdentifier
    : undefined;
  const filterColumnsProp =
    searchEnabled && searchColumnIds.length > 0 ? searchColumnIds : undefined;

  useEffect(() => {
    if (!resource) return;

    const resourceChanged = prevResourceRef.current !== resource;
    const resourceNameChanged = prevResourceNameRef.current !== resource_name;

    if (!resourceChanged && !resourceNameChanged) return;

    prevResourceRef.current = resource;
    prevResourceNameRef.current = resource_name;

    const deferToHeader = resource.deferToHeader ?? false;
    const deferTitle = resource.deferTitleToHeader ?? deferToHeader;
    const deferSubtitle = resource.deferSubtitleToHeader ?? deferToHeader;
    const deferNewButton = resource.deferNewButtonToHeader ?? deferToHeader;

    if (deferTitle) {
      setTitle(resource.page_label || prettyString(resource_name));
    }

    if (deferSubtitle && resource.page_label) {
      setSubtitle("");
    }

    if (deferNewButton && resource.enableNewResourceCreation) {
      const buttonText =
        resource.newResourceButtonText ||
        `New ${resource.page_label || resource_name}`;

      const handleNewResource = () => {
        if (createCfg) {
          if (!canSeeCreate) return;
          if (!canCreate) {
            notification({
              message: "You don't have permission to create this resource",
              success: false,
            });
            return;
          }
          setCreateOpen(true);
        } else {
          const joinRoute = (...parts: string[]) =>
            `/${parts.join("/")}`.replace(/\/+/g, "/");
          const seg = String(resource.path || resource_name || "").replace(
            /^\/+/,
            ""
          );
          const href = resource.newResourceHref || joinRoute("v2", seg, "new");
          window.location.href = href;
        }
      };

      setHeaderActions([
        {
          id: "new-resource",
          label: buttonText,
          icon: <Plus className="w-4 h-4 stroke-icon" />,
          onClick: handleNewResource,
          variant: "brand",
          size: "xs",
        },
      ]);
    }
  });

  useEffect(() => {
    return () => {
      clearContentStore();
    };
  }, []);

  if (isError) {
    return (
      <ResourceError
        fullPage
        title="failed to load data"
        content={error || `could not load resources for "${resource_name}"`}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div
      id="resource-table-root"
      className={cn(
        "mx-auto w-full space-y-5 p-4 py-4 sm:px-0 transition-[max-width] duration-200 ease-in-out",
        // Widen/fullscreen mode: remove all max-width constraints
        view?.styling?.tables_extra_side_padding ? "" : "sm:max-w-7xl"
      )}
    >
      {(() => {
        let Comp: React.ComponentType | React.ReactElement | undefined;
        try {
          Comp = resource?.customComponent as
            | React.ComponentType
            | React.ReactElement
            | undefined;
        } catch {
          return null;
        }

        if (!Comp) return null;

        return (
          <div id="resource-table-custom-component" className="px-4 sm:px-0">
            {typeof Comp === "function" || typeof Comp === "object" ? (
              React.isValidElement(Comp) ? (
                Comp
              ) : (
                <Comp />
              )
            ) : null}
          </div>
        );
      })()}
      <AthenaResourceTable
        columns={columns as ColumnDef<TableRowData>[]}
        data={filteredData}
        isLoading={isLoading || resourceLoading}
        title={(() => {
          const deferToHeader = resource?.deferToHeader ?? false;
          const deferTitle = resource?.deferTitleToHeader ?? deferToHeader;
          return deferTitle
            ? undefined
            : `${resource?.page_label || resource_name}`;
        })()}
        disableFullscreenView={false}
        onAddItemAction={(() => {
          if (!resource?.enableNewResourceCreation) return undefined;
          if (addResourceProps.onAddResourceButton) return undefined;

          const deferToHeader = resource?.deferToHeader ?? false;
          const deferNewButton =
            resource?.deferNewButtonToHeader ?? deferToHeader;

          if (deferNewButton) return undefined;

          if (createCfg) {
            if (!canSeeCreate) return undefined;
            return () => {
              if (!canCreate) {
                notification({
                  message: "You don't have permission to create this resource",
                  success: false,
                });
                return;
              }
              setCreateOpen(true);
            };
          }
          return () => {
            const joinRoute = (...parts: string[]) =>
              `/${parts.join("/")}`.replace(/\/+/g, "/");
            const seg = String(resource?.path || resource_name || "").replace(
              /^\/+/,
              ""
            );
            const href =
              resource?.newResourceHref || joinRoute("v2", seg, "new");
            window.location.href = href;
          };
        })()}
        addItemLabel={(() => {
          if (!resource?.enableNewResourceCreation) return undefined;
          if (addResourceProps.addResourceLabel) return undefined;
          if (createCfg && !canSeeCreate) return undefined;
          return (
            resource?.newResourceButtonText ||
            `New ${prettyString(resource?.page_label || resource_name)}`
          );
        })()}
        hrefAction={(row) => {
          const isInvalidHref = (href: string) => {
            const s = href.trim();
            if (!s) return true;
            if (s.includes("undefined")) return true;
            if (/(^|\/)undefined(\/|$)/.test(s)) return true;
            return false;
          };

          const notifyMissing = (field: string) => {
            notification({
              message: `Missing ${field} for drilldown`,
              success: false,
            });
          };

          try {
            const rowData = row as TableRowData;
            const idColumn = resource?.idColumn || "id";
            const rawId = getValueByKeyCase(rowData, String(idColumn));
            const hasId =
              rawId !== null &&
              rawId !== undefined &&
              String(rawId).trim() !== "";

            const custom = resource?.drilldownHref;
            if (typeof custom === "function") {
              const href = custom(rowData);
              if (href && typeof href === "string" && !isInvalidHref(href)) {
                return href;
              }
              return undefined;
            }

            if (typeof custom === "string" && custom.trim() !== "") {
              const keys = Array.from(custom.matchAll(/\{\{(.*?)\}\}/g)).map(
                (m) => (m?.[1] || "").trim()
              );
              for (const key of keys) {
                if (!key) continue;
                const v = key.includes(".")
                  ? getValueByPathCase(rowData, key)
                  : getValueByKeyCase(rowData, key);
                if (v === null || v === undefined || String(v).trim() === "") {
                  notifyMissing(key);
                  return undefined;
                }
              }

              const href = custom.replace(
                /\{\{(.*?)\}\}/g,
                (_: string, key: string) => {
                  const k = String(key || "").trim();
                  const v = k.includes(".")
                    ? getValueByPathCase(rowData, k)
                    : getValueByKeyCase(rowData, k);
                  return String(v ?? "");
                }
              );
              if (!isInvalidHref(href)) return href;
              return undefined;
            }

            if (!hasId) {
              notifyMissing(String(idColumn));
              return undefined;
            }

            const id = String(rawId);
            const prefix = resource?.drilldownRoutePrefix;
            if (typeof prefix === "string" && prefix.trim() !== "") {
              const base = prefix.startsWith("/") ? prefix : `/${prefix}`;
              const href = `${base}/${id}`;
              return isInvalidHref(href) ? undefined : href;
            }

            const joinRoute = (...parts: string[]) =>
              `/${parts.join("/")}`.replace(/\/+/g, "/");
            const seg = String(resource?.path || resource_name || "").replace(
              /^\/+/,
              ""
            );
            const href = joinRoute("v2", seg, id);
            return isInvalidHref(href) ? undefined : href;
          } catch {
            return undefined;
          }
        }}
        filterColumn={primaryFilterColumn}
        filterColumns={filterColumnsProp}
        defaultSorting={
          querySort
            ? [querySort]
            : columns?.length
              ? [
                  {
                    id: getColumnIdentifier(columns[0]) ?? "id",
                    desc: true,
                  },
                ]
              : []
        }
        displayContext={displayContext}
        displayConfig={displayConfig}
        allowDownloadCsv={true}
        forceWrappingHeaderLabels={Boolean(resource?.forceWrappingHeaderLabels)}
       
        {...addResourceProps}
      />
      {!resource && !resourceLoading && (
        <ResourceError
          fullPage
          title="resource not found"
          content={`the resource "${resource_name}" does not exist or is not configured`}
        />
      )}

      {createCfg && resource?.enableNewResourceCreation && (
        <CreateResourceDialog
          open={createOpen}
          onCloseAction={() => setCreateOpen(false)}
          title={`New ${prettyString(resource?.page_label || resource_name)}`}
          required={
            Array.isArray(createCfg?.required) ? createCfg.required : []
          }
          optional={
            Array.isArray(createCfg?.optional) ? createCfg.optional : []
          }
          columns={createColumns}
          DialogComponent={createCfg?.dialog}
          table={resource?.table}
          schema={resource?.schema}
          defaultValues={createCfg?.defaultValues}
          createAction={createAction}
          onCreatedAction={(row: TableRowData | null) => {
            try {
              if (row) {
                if (localInitialData) {
                  setLocalInitialData((current) => [row, ...(current ?? [])]);
                } else if ("mutate" in apiResult) {
                  void apiResult.mutate();
                }
                notification({ message: "Created successfully", success: true });
              }

              if (!createCfg.navigateToCreatedResource) return;
              const idColumn = resource?.idColumn || "id";
              const id = row?.[idColumn];
              if (id != null) {
                const prefix = resource?.drilldownRoutePrefix;
                const joinRoute = (...parts: string[]) =>
                  `/${parts.join("/")}`.replace(/\/+/g, "/");
                if (typeof prefix === "string" && prefix.trim() !== "") {
                  const base = prefix.startsWith("/") ? prefix : `/${prefix}`;
                  window.location.href = `${base}/${id}`;
                  return;
                }
                const seg = String(
                  resource?.path || resource_name || ""
                ).replace(/^\/+/, "");
                window.location.href = joinRoute("v2", seg, String(id));
              } else {
                window.location.reload();
              }
            } catch {
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
};
