"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useApiClient } from "../hooks/use-api-client";
import { useUserStore } from "@/lib/stores";
import { prettyString } from "@/lib/format/string";
import { useNotification } from "@/hooks/use-notifications";
import { CreateResourceDialog } from "./create-resource-dialog";
import type { ColumnConfig, ResourceRouteRow } from "../resource-types";

/**
 * Button component that opens a dialog to create a new resource
 * @param props - Component props including resourceName, label, className, and cacheEnabled
 * @returns React component
 */
export function CreateResourceButton(props: {
  resourceName: string;
  label?: string;
  className?: string;
  cacheEnabled?: boolean;
}) {
  const { resourceName, label, className, cacheEnabled = false } = props;
  const { user } = useUserStore();
  const { notification } = useNotification();
  const [open, setOpen] = useState(false);

  const routeByResourceResult = useApiClient<ResourceRouteRow>({
    table: "resource_routes",
    conditions: [{ eq_column: "resource_name", eq_value: resourceName }],
    single: true,
    enabled: Boolean(
      resourceName && user?.user_id &&
        user?.organization_id,
    ),
    noCache: !cacheEnabled,
  });

  const routeByTableResult = useApiClient<ResourceRouteRow>({
    table: "resource_routes",
    conditions: [{ eq_column: "table", eq_value: resourceName }],
    single: true,
    enabled: Boolean(
      resourceName &&
        user?.user_id &&
        user?.organization_id &&
        !("data" in routeByResourceResult && routeByResourceResult.data),
    ),
    noCache: !cacheEnabled,
  });

  const routeByResource = "data" in routeByResourceResult
    ? routeByResourceResult.data
    : null;
  const loadingByResource = "isLoading" in routeByResourceResult
    ? routeByResourceResult.isLoading
    : false;
  const routeByTable = "data" in routeByTableResult
    ? routeByTableResult.data
    : null;
  const loadingByTable = "isLoading" in routeByTableResult
    ? routeByTableResult.isLoading
    : false;

  // Derive loading and route state from query results using useMemo
  const loading = useMemo(() => loadingByResource || loadingByTable, [
    loadingByResource,
    loadingByTable,
  ]);
  const route = useMemo(() => {
    return (routeByResource || routeByTable || null) as ResourceRouteRow | null;
  }, [routeByResource, routeByTable]);

  const isEnabled = Boolean(route?.enable_new_resource_creation);
  const buttonLabel = label ||
    route?.new_resource_button_text ||
    `New ${prettyString(route?.page_label || resourceName)}`;

  if (!loading && (!route || !isEnabled)) {
    return null;
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => {
          if (!isEnabled) {
            notification({
              message: "Creation is disabled for this resource",
              success: false,
            });
            return;
          }
          setOpen(true);
        }}
        className={className}
      >
        {buttonLabel}
      </Button>
      <CreateResourceDialog
        open={open}
        onCloseAction={() => setOpen(false)}
        title={`New ${prettyString(route?.page_label || resourceName)}`}
        required={Array.isArray(route?.new_resource_mandatory_columns)
          ? (route?.new_resource_mandatory_columns as string[])
          : typeof route?.new_resource_mandatory_columns === "string"
          ? [String(route?.new_resource_mandatory_columns)]
          : []}
        optional={Array.isArray(route?.new_resource_optional_columns)
          ? (route?.new_resource_optional_columns as string[])
          : typeof route?.new_resource_optional_columns === "string"
          ? [String(route?.new_resource_optional_columns)]
          : []}
        columns={Array.isArray(route?.columns)
          ? (route?.columns as unknown as ColumnConfig[])
          : undefined}
        table={String(route?.table || "")}
        resourceName={resourceName}
        cacheEnabled={cacheEnabled}
        onCreatedAction={() => {
          try {
            window.location.reload();
          } catch {}
        }}
      />
    </>
  );
}
