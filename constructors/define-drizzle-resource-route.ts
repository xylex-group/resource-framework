"use client";

import type { BuiltColumnSpec, ResourceFieldSpec, ResourceRoute } from "../resource-types";
import { defineColumns } from "./define-columns";
import type {
  DrizzleColumnFieldType,
  DrizzleColumnName,
  DrizzleTableName,
} from "../types/drizzle-schema";

export type DrizzleResourceFieldSpec<
  TTable extends DrizzleTableName,
  TColumn extends DrizzleColumnName<TTable> = DrizzleColumnName<TTable>,
> =
  Omit<
    ResourceFieldSpec,
    "column_name" | "field_type"
  > & {
    column_name: TColumn;
    field_type?: DrizzleColumnFieldType<TTable, TColumn>;
  };

export type DrizzleBuiltColumnSpec<TTable extends DrizzleTableName> =
  Omit<BuiltColumnSpec, "column_name"> & {
    column_name: DrizzleColumnName<TTable>;
  };

export type DrizzleResourceRoute<TTable extends DrizzleTableName> =
  Omit<ResourceRoute, "table" | "idColumn" | "companyIdColumn" | "columns"> & {
    table: TTable;
    idColumn: DrizzleColumnName<TTable>;
    companyIdColumn?: DrizzleColumnName<TTable>;
    columns?: Array<string | DrizzleBuiltColumnSpec<TTable>>;
  };

/**
 * typed resource route builder.
 * gives intellisense for table + columns based on drizzle schema, without importing drizzle at runtime.
 */
export function defineDrizzleResourceRoute<TTable extends DrizzleTableName>(
  route: DrizzleResourceRoute<TTable>,
): ResourceRoute {
  return {
    ...route,
    drizzleTable: route.table,
  } as unknown as ResourceRoute;
}

/**
 * typed wrapper around defineColumns so column_name is inferred from drizzle schema.
 */
export function defineDrizzleColumns<TTable extends DrizzleTableName>(
  specs: DrizzleResourceFieldSpec<TTable>[],
): DrizzleBuiltColumnSpec<TTable>[] {
  return defineColumns(specs as unknown as ResourceFieldSpec[]) as
    unknown as DrizzleBuiltColumnSpec<TTable>[];
}


