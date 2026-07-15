"use client";

import { useEffect, useState } from "react";
import { RESOURCE_ROUTES } from "../registries/resource-routes";
import { type ResourceRoute } from "../resource-types";
import { fetchDataViaAthena } from "../adapters/athena-gateway";

/**
 * Hook to fetch and manage resource route configuration.
 * Attempts to load from static RESOURCE_ROUTES first, then falls back to fetching from the database using Athena.
 *
 * @param resourceName - The name of the resource to load configuration for
 * @param user - The current user object containing user_id, company_id, and organization_id
 * @returns Object containing the resource configuration, loading state, and remote resource data
 *
 * @example
 * ```tsx
 * function ResourcePage() {
 *   const { user } = useUserStore();
 *   const { resource, resourceLoading } = useResourceRoute('customers', user);
 *
 *   if (resourceLoading) return <Loading />;
 *   if (!resource) return <NotFound />;
 *
 *   return <ResourceTable resource={resource} />;
 * }
 * ```
 */
export const useResourceRoute = (
  resourceName: string | undefined,
  user: {
    user_id?: string | number | null;
    company_id?: string | number | null;
    organization_id?: string | number | null;
  } | null,
) => {
  const staticResource = resourceName
    ? (RESOURCE_ROUTES as Record<string, unknown>)[resourceName]
    : undefined;
  const [remoteResource, setRemoteResource] = useState<ResourceRoute | null>(
    null,
  );
  const [resourceLoading, setResourceLoading] = useState(false);

  const resource: ResourceRoute | null = (staticResource as ResourceRoute) ||
    remoteResource;

  useEffect(() => {
    let cancelled = false;
    async function loadRoute() {
      try {
        if (
          staticResource ||
          !resourceName ||
          !user?.user_id ||
          !user?.company_id ||
          !user?.organization_id
        ) {
          return;
        }
        setResourceLoading(true);

        // Helper function to fetch route by column
        async function fetchRouteBy(column: "resource_name" | "table") {
          const response = await fetchDataViaAthena({
            table_name: "resource_routes",
            conditions: [{ eq_column: column, eq_value: resourceName || "" }],
            limit: 1,
          });

          if (response.error || !response.data) {
            return null;
          }

          const rows = Array.isArray(response.data) ? response.data : [];
          return rows.length > 0 ? rows[0] : null;
        }

        // Try fetching by resource_name first, then by table name
        let row = await fetchRouteBy("resource_name");
        if (!row) {
          row = await fetchRouteBy("table");
        }
        if (!row || cancelled) return;

        // Helper functions to transform data
        const toArray = (v: unknown): unknown[] =>
          Array.isArray(v) ? v : typeof v === "string" ? [v] : [];

        const mapColumns = (cols: unknown): Array<Record<string, unknown>> => {
          const arr = toArray(cols);
          return arr
            .map((c: unknown) => {
              if (typeof c === "string") {
                return { column_name: c };
              }
              if (
                c && typeof c === "object" && c !== null && "column_name" in c
              ) {
                return c as Record<string, unknown>;
              }
              return null;
            })
            .filter((item): item is Record<string, unknown> =>
              item !== null
            ) as Array<Record<string, unknown>>;
        };

        // Map database row to ResourceRoute format
        const rowData = row as Record<string, unknown>;
        const mapped: ResourceRoute = {
          table: (rowData?.table as string) || (resourceName || ""),
          athenaModel: (rowData?.table as string) || undefined,
          idColumn: (rowData?.id_column as string) || "id",
          path: (rowData?.path as string) || undefined,
          schema: (rowData?.schema as string) || undefined,
          force_no_cache: Boolean(rowData?.force_no_cache),
          force_remove_back_button_store_on_index_resource: Boolean(
            rowData?.force_remove_back_button_store_on_index_resource,
          ),
          enableSearch: Boolean(rowData?.enable_search),
          searchBy: (rowData?.search_by as string) || undefined,
          avatar_column: (rowData?.avatar_column as string) || undefined,
          icon: (rowData?.icon as string) || undefined,
          page_label: (rowData?.page_label as string) || undefined,
          enableNewResourceCreation: Boolean(
            rowData?.enable_new_resource_creation,
          ),
          newResourceButtonText:
            (rowData?.new_resource_button_text as string) || undefined,
          newResourceHref: (rowData?.new_resource_href as string) || undefined,
          forceWrappingHeaderLabels: Boolean(
            rowData?.force_wrapping_header_labels,
          ),
          disableCompanyFilter: Boolean(rowData?.disable_company_filter),
          columns: mapColumns(rowData?.columns),
          companyIdColumn: (rowData?.company_id_column as string) || undefined,
          drilldownRoutePrefix: (rowData?.drilldown_route_prefix as string) ||
            undefined,
          permanent_edit_state: rowData?.permanent_edit_state || false,
          sidebar_route: (rowData?.sidebar_route as string) || undefined,
          drilldownHref: (rowData?.drilldown_href as string) || undefined,
          edit: {
            enabled: Boolean(rowData?.enable_edit),
            allowedColumns: toArray(rowData?.allowed_columns_edit) as string[],
            deniedColumns: toArray(rowData?.denied_columns_edit) as string[],
            scope: (rowData?.scope as string) || undefined,
            IgnoreCompanyCheckBeforeMutation: Boolean(
              rowData?.ignore_company_check_before_mutation,
            ),
          },
          create: (() => {
            const req = toArray(
              rowData?.new_resource_mandatory_columns,
            ) as string[];
            const opt = toArray(
              rowData?.new_resource_optional_columns,
            ) as string[];
            if ((req && req.length) || (opt && opt.length)) {
              return {
                scope: [],
                required: req,
                optional: opt,
              };
            }
            return undefined;
          })(),
        } as ResourceRoute;

        setRemoteResource(mapped);
      } catch (error) {
        console.error("Error loading resource route:", error);
        // Set loading to false on error
        if (!cancelled) setResourceLoading(false);
      } finally {
        if (!cancelled) setResourceLoading(false);
      }
    }
    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [
    staticResource,
    resourceName,
    user,
  ]);

  return { resource, resourceLoading, remoteResource };
};
