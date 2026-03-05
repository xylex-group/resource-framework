"use client";

import { useMemo, useState } from "react";

import { LeanTable } from "@/components/ui-responsive/lean-table";
import type { LeanTableTitleSize } from "@/components/ui-responsive/lean-table";
import { useUserStore } from "@/lib/stores";
import { cn } from "@/lib/utils";
import { buildTableColumns } from "../../../utils/column-builder";
import { useResourceRoute } from "../../../hooks/useResourceRoute";
import { useApiClient } from "../../../hooks/use-api-client";
import {
  registerSectionWidget,
  type SectionWidgetRendererProps,
} from "./registry";
import type {
  Primitive,
  TableRowData,
  TableWidgetProps,
} from "../../../resource-types";
import ErrorBlock from "@/components/ui/error";
import {
  buildWidgetConditions,
  interpolateWidgetValue,
} from "../../../utils/widget-conditions";
import { getValueByKeyCase, getValueByPathCase } from "../../../utils/key-case";
import { CreateResourceDialog } from "../../create-resource-dialog";
import { prettyString } from "@/lib/format/string";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function TableSectionWidget({
  spec,
  entity,
}: SectionWidgetRendererProps) {
  const { user } = useUserStore();
  const isTableWidget = spec.type === "table";
  const props = isTableWidget
    ? ((spec.props || {}) as TableWidgetProps)
    : ({} as TableWidgetProps);
  
    const userContextForRoute = user
    ? {
      user_id: user.user_id,
      organization_id: user.organization_id,
    }
    : null;

  const { resource } = useResourceRoute(props.resourceName, userContextForRoute);
  const conditions = buildWidgetConditions(props, entity);

  const apiResult = useApiClient<TableRowData>({
    table: resource?.table || "",
    schema: resource?.schema || "public",
    conditions,
    columns: props.columns,
    enabled: Boolean(resource?.table && user?.organization_id),
    limit: props.limit,
  });

  const hasDataResponse = "data" in apiResult;
  const data =
    hasDataResponse && Array.isArray(apiResult.data) && apiResult.data.length > 0
      ? apiResult.data
      : [];

  const columns = buildTableColumns(data, resource);
  const filteredColumns =
    Array.isArray(props.columns) && props.columns.length > 0
      ? columns.filter((col) => {
        const colId =
          (col as { accessorKey?: string }).accessorKey ??
          (col as { id?: string }).id;
        return !!colId && props.columns!.includes(colId);
      })
      : columns;

  const widgetCreateConfig = props.create;
  const routeCreateConfig = resource?.create;

  const canCreate =
    Boolean(
      resource &&
        (widgetCreateConfig?.columns?.length ??
          routeCreateConfig?.columns?.length) &&
        resource.enableNewResourceCreation !== false,
    ) && props.enableAddButton !== false;

  const createRequired =
    widgetCreateConfig?.required ?? routeCreateConfig?.required ?? [];
  const createOptional =
    widgetCreateConfig?.optional ?? routeCreateConfig?.optional ?? [];
  const createColumns =
    widgetCreateConfig?.columns ?? routeCreateConfig?.columns;
  const createDialog = widgetCreateConfig?.dialog ?? routeCreateConfig?.dialog;
  const rawScope =
    widgetCreateConfig?.showButtonScope ?? routeCreateConfig?.showButtonScope;
  const scopeAddResourceButton = Array.isArray(rawScope)
    ? rawScope[0]
    : rawScope;
  const addResourceLabel =
    resource?.newResourceButtonText ??
    `New ${prettyString(resource?.page_label || props.resourceName)}`;

  const [createOpen, setCreateOpen] = useState(false);

  const derivedDefaultValues = useMemo(() => {
    const base: Partial<Record<string, Primitive>> = {
      ...(widgetCreateConfig?.defaultValues ?? {}),
    };

    if (props.conditions && entity) {
      for (const condition of props.conditions) {
        const resolved = interpolateWidgetValue(condition.eq_value, entity);
        if (resolved !== undefined) {
          base[condition.eq_column] = resolved;
        }
      }
    }

    return base;
  }, [entity, props.conditions, widgetCreateConfig?.defaultValues]);

  if (hasDataResponse && apiResult.isError) {
    return (
      <ErrorBlock
        fullPage={false}
        type="error"
        title={`Could not load ${props.resourceName}`}
        content={apiResult.error ?? "Failed to load table data"}
        isError={true}
        setIsError={() => {}}
      />
    );
  }

  const hideTopControls = props.enableSearch === false;
  const showCreateButton = canCreate && Boolean(user?.organization_id);
  const rowHref = (rowData: TableRowData): string | undefined => {
    try {
      const custom = resource?.drilldownHref;
      if (typeof custom === "function") {
        const href = custom(rowData);
        return typeof href === "string" && href.trim() !== "" ? href : undefined;
      }
      if (typeof custom === "string" && custom.trim() !== "") {
        const href = custom.replace(
          /\{\{(.*?)\}\}/g,
          (_: string, key: string) => {
            const k = String(key || "").trim();
            const v = k.includes(".")
              ? getValueByPathCase(rowData, k)
              : getValueByKeyCase(rowData, k);
            return String(v ?? "");
          },
        );
        return href.trim() !== "" ? href : undefined;
      }

      const idColumn = resource?.idColumn || "id";
      const rawId = getValueByKeyCase(rowData, String(idColumn));
      const id = rawId != null ? String(rawId).trim() : "";
      const hasValidId =
        Boolean(id) &&
        id !== "undefined" &&
        id !== "null" &&
        id !== "new";
      if (!hasValidId) return undefined;

      const prefix = resource?.drilldownRoutePrefix;
      if (typeof prefix === "string" && prefix.trim() !== "") {
        const base = prefix.startsWith("/") ? prefix : `/${prefix}`;
        return `${base}/${id}`;
      }

      const joinRoute = (...parts: string[]) =>
        `/${parts.join("/")}`.replace(/\/+/g, "/");
      const seg = String(resource?.path || props.resourceName || "").replace(
        /^\/+/,
        "",
      );
      const fallback = joinRoute("v2", seg, id);
      return fallback;
    } catch {
      return undefined;
    }
  };

  const addIconButton = showCreateButton ? (
    <Button
      variant="icon_v2"
      size="icon_v2"
      className="ml-2"
      icon={<Plus className="w-4 h-4 stroke-icon" aria-hidden="true" />}
      aria-label={`New ${prettyString(resource?.page_label || props.resourceName)}`}
      onClick={() => setCreateOpen(true)}
    />
  ) : undefined;

  if (!isTableWidget) {
    return null;
  }

  return (
    <div>
      <LeanTable
        data={data}
        title={props.title}
        titleSize={props.titleSize as LeanTableTitleSize | undefined}
        columns={filteredColumns}
        hideTopControls={hideTopControls}
        rowsPerPage={props.limit ?? 25}
        forceWrappingHeaderLabels={true}
        disableFullscreenView={true}
        className={cn("w-full")}
        hrefAction={rowHref}
        addResourceButton={addIconButton}
        scopeAddResourceButton={scopeAddResourceButton}
      />
      {showCreateButton && (
        <CreateResourceDialog
          open={createOpen}
          onCloseAction={() => setCreateOpen(false)}
          title={addResourceLabel}
          required={createRequired}
          optional={createOptional}
          columns={createColumns}
          DialogComponent={createDialog}
          table={resource?.table}
          defaultValues={derivedDefaultValues}
          onCreatedAction={() => {
            setCreateOpen(false);
            if ("mutate" in apiResult && typeof apiResult.mutate === "function") {
              void apiResult.mutate();
            }
          }}
          resourceName={props.resourceName}
        />
      )}
    </div>
  );
}

registerSectionWidget("table", TableSectionWidget);

export { TableSectionWidget };
