import type { ResourceRoute } from "../resource-types";

/**
 * Builds database query conditions for a resource based on organization filtering and resource-specific rules.
 * Automatically adds organization_id filter unless disabled, and applies special conditions for certain resources.
 *
 * @param resource - The resource route configuration
 * @param companyId - The current organization ID to filter by (legacy parameter name for compatibility)
 * @param resourceName - The name of the resource (used for special case handling)
 * @returns Array of condition objects for database queries
 *
 * @example
 * ```tsx
 * const conditions = buildResourceConditions(resource, user.organization_id, 'invoices');
 * // conditions = [
 * //   { eq_column: 'organization_id', eq_value: '123' },
 * //   { eq_column: 'awaiting_archival', eq_value: false }
 * // ]
 * ```
 */
export const buildResourceConditions = (
  resource: ResourceRoute | null,
  companyId: string | number | null | undefined,
  resourceName: string | null | undefined,
): Array<{ eq_column: string; eq_value: string | number | boolean }> => {
  const list: Array<
    { eq_column: string; eq_value: string | number | boolean }
  > = [];

  const resourceExt = resource as ResourceRoute & {
    disableCompanyFilter?: boolean;
    companyIdColumn?: string;
  };

  if (resource && companyId && !resourceExt?.disableCompanyFilter) {
    list.push({
      eq_column: resourceExt?.companyIdColumn || "organization_id",
      eq_value: companyId,
    });
  }

  if (resourceName === "invoices") {
    list.push({
      eq_column: "awaiting_archival",
      eq_value: false,
    });
  }

  return list;
};
