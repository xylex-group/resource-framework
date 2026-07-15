"use client";

import type {
  BuiltColumnSpec,
  ResourceRoute,
  ResourceRouteEntry,
  ResourceRouteRegistry,
} from "../resource-types";

export const resourceRoutes: ResourceRouteRegistry = {};

import {
  getAthenaColumnInfo,
  getAthenaColumnMetadata,
} from "../athena/model-metadata";
import { coreResourceRoutes } from "./resource-routes-core";
import { customerResourceRoutes } from "./resource-routes-customers";
import { transactionResourceRoutes } from "./resource-routes-transactions";

/**
 * Retrieves a resource route entry by name from the resource registry.
 * Performs case-insensitive lookup.
 *
 * @param name - The name of the resource to retrieve
 * @returns The ResourceRouteEntry if found, null otherwise
 *
 * @example
 * ```tsx
 * const route = getResourceRoute('customers');
 * if (route) {
 *   console.log(route.title, route.path);
 * }
 * ```
 */
export function getResourceRoute(name: string): ResourceRouteEntry | null {
  const key = String(name || "").toLowerCase();
  return resourceRoutes[key] ?? null;
}

// Compatibility constants expected by consumer components

export const RESOURCE_ROUTES: Record<string, ResourceRoute> = {
  ...coreResourceRoutes,
  ...customerResourceRoutes,
  ...transactionResourceRoutes,
};

const formatWarning = (
  _routeName: string,
  _columnName: string,
  _issue: string,
) => {
  // Suppressed: Schema validation warnings are too verbose and clutter the console
  // Uncomment the line below if you need to debug schema mismatches
  // console.warn(
  //   `[resource-framework][${routeName}] Column "${columnName}" ${issue}`,
  // );
};

const validateResourceColumns = (
  routeName: string,
  tableName: string | undefined,
  columns?: ResourceRoute["columns"],
) => {
  if (!tableName || !columns) return;
  const table = tableName;
  columns.forEach((column) => {
    const columnConfig = typeof column === "string"
      ? { column_name: column }
      : column;
    const columnName = columnConfig.column_name;
    if (!columnName) return;
    const meta = getAthenaColumnMetadata(table, columnName);
    if (!meta) {
      formatWarning(routeName, columnName, "does not exist in schema");
      return;
    }
    const columnInfo = getAthenaColumnInfo(table, columnName);
    const schemaFieldDataType = columnInfo.dataType;
    const actualTypeLabel = meta.kind ?? schemaFieldDataType;
    const expectedType = columnConfig &&
      typeof columnConfig !== "string" &&
      "data_type" in columnConfig
      ? columnConfig.data_type
      : undefined;
    if (schemaFieldDataType) {
      const target = typeof column === "object"
        ? (column as BuiltColumnSpec)
        : undefined;
      if (target && !target.data_type) {
        target.data_type = schemaFieldDataType;
      }
    }
    if (
      expectedType &&
      typeof expectedType === "string" &&
      actualTypeLabel &&
      expectedType.toLowerCase() !== String(actualTypeLabel).toLowerCase()
    ) {
      formatWarning(
        routeName,
        columnName,
        `declares data_type "${expectedType}" but Athena reports "${meta.kind}"`,
      );
    }
  });
};

Object.entries(RESOURCE_ROUTES).forEach(([name, route]) => {
  const tableName = Array.isArray(route.table)
    ? route.table[0]
    : route.table || route.athenaModel;
  validateResourceColumns(name, tableName, route.columns);
});
