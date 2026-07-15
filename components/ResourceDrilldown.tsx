"use client";

import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApiClient } from "../hooks/use-api-client";
import { useUpdateData } from "../hooks/use-update-data";
import { fetchDataViaAthena } from "../adapters/athena-gateway";

import { useNotification } from "@/hooks/use-notifications";
import { Code2, Pencil, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RESOURCE_DRILLDOWN_ROUTES } from "../registries/resource-drilldown-routes";
import { RESOURCE_ROUTES } from "../registries/resource-routes";
import type { LeanColumnSpec, ResourceRoute } from "../resource-types";
import { useContentStore, useUserStore, useViewStore } from "@/lib/stores";
import { handleSaveAll } from "./edit-state/save-all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ErrorBlock from "@/components/ui/error";
import { ResponsiveDropdownV2 } from "@/components/ui-responsive/responsive-dropdown-v2";
import { ResponsiveDialog } from "@/components/ui-responsive/responsive-dialog";
import { DrilldownEntityRenderer } from "./drilldown/drilldown-entity-renderer";
import { DrilldownLayout } from "./drilldown/drilldown-layout";
import { ResourceDrilldownEditor } from "./resource-drilldown-editor";
import { calculatePendingChanges } from "./resource-drilldown-changes";
import { useDataSourceLabels } from "./use-data-source-labels";
import { JsonBlock } from "@/components/json/json-block";
import {
  buildColumnsFromRegistry,
} from "../constructors/column-registry";
import { useUserScopes } from "../hooks/useUserScopes";
import { UnsavedChanges } from "./edit-state/unsaved-changes";
import type {
  ApiResult,
  ColumnConfigObject,
  DrilldownField,
  EditorConfig,
  FetchCondition,
  FormStateData,
  RemoteResourceRouteResponse,
  ResourceData,
} from "@/lib/types";
import {
  getDrilldownTitle,
} from "./resource_drilldown_helpers";

import { buildDrilldownConditions, hasUsableResourceId, mapRemoteResourceRoute } from "./resource-drilldown-route";

export const ResourceDrilldown = ({
  resourceName,
  resourceId,
  initialData,
}: {
  resourceName?: string;
  resourceId?: string;
  initialData?: ResourceData;
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
  const athenaModelName = resource?.athenaModel ||
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
    enabled: initialData === undefined && Boolean(
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
  const {
    data: apiData,
    isLoading: apiIsLoading,
    isError: apiIsError,
    error,
    mutate,
  } = apiResult as
    & ApiResult<ResourceData>
    & { mutate?: () => Promise<void> };
  const data = initialData ?? apiData;
  const isLoading = initialData === undefined && apiIsLoading;
  const isError = initialData === undefined && apiIsError;

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

  const { pendingChangesCount, pendingChangesList } = useMemo(
    () => calculatePendingChanges({
      columns: resource?.columns,
      data,
      formState,
      isEditing,
    }),
    [isEditing, data, formState, resource?.columns],
  );

  const dataSourceLabels = useDataSourceLabels({
    data,
    organizationId: user?.organization_id,
    resource,
    userId: user?.user_id,
  });

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
                  <Select
                    disabled={isLoading}
                    value={String(row[key] ?? "")}
                    onValueChange={async (nextVal) => {
                      await update({ [updateColumn]: nextVal });
                    }}
                  >
                    <SelectTrigger className="min-w-45">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {editable.options.map((opt) => (
                        <SelectItem key={String(opt.value)} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            <ResourceDrilldownEditor
              activeEditTabIndex={activeEditTabIndex}
              athenaModelName={athenaModelName}
              data={data}
              drilldownConfig={drilldownCfg}
              formState={formState}
              resource={resource}
              resourceId={resource_id}
              resourceName={resource_name}
              setActiveEditTabIndex={setActiveEditTabIndex}
              setFormState={setFormState}
              setVisibleFields={setVisibleFields}
              visibleFields={visibleFields}
            />
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
