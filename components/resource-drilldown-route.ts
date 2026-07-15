import type { ResourceRoute } from "../resource-types";
import type { ColumnConfigObject, ColumnConfiguration, FetchCondition, RemoteResourceRouteResponse } from "@/lib/types";

const INVALID_RESOURCE_ID_VALUES = new Set(["", "new", "undefined", "null"]);

export function hasUsableResourceId(resourceId?: string): boolean {
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

export function mapRemoteResourceRoute(
  remoteRow: RemoteResourceRouteResponse,
  resourceName: string,
): ResourceRoute {
  return {
    table: remoteRow?.table || resourceName,
    idColumn: remoteRow?.id_column || "id",
    athenaModel: remoteRow?.table as string | undefined,
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

export function buildDrilldownConditions({
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

  if (hasValidResourceId && resource?.idColumn && resourceId !== undefined) {
    list.push({
      eq_column: resource.idColumn,
      eq_value: resourceId,
    });
  }

  return list;
}

