import type { FieldInputType, FieldDataType } from "../resource-types";
import type { DrizzleTableName } from "../types/drizzle-schema";

import { schemaSnapshot } from "@/drizzle/meta/0000_snapshot";

type SchemaSnapshot = typeof schemaSnapshot;
type SnapshotColumn = {
  type: string;
  notNull?: boolean;
  default?: string;
};
type SnapshotTable = {
  columns: Record<string, SnapshotColumn>;
};

const TYPE_TO_FIELD_TYPE: Record<string, FieldInputType> = {
  boolean: "boolean",
  bool: "boolean",
  tinyint: "number",
  smallint: "number",
  integer: "number",
  int: "number",
  bigint: "number",
  decimal: "number",
  numeric: "number",
  real: "number",
  double: "number",
  "double precision": "number",
  serial: "number",
  bigserial: "number",
  money: "number",
  float: "number",
  text: "text",
  uuid: "text",
  date: "date",
  timestamp: "date",
  timestamptz: "date",
  json: "text",
  jsonb: "text",
  varchar: "text",
  "character varying": "text",
  citext: "text",
  inet: "text",
};

const TYPE_TO_FIELD_DATATYPE: Record<string, FieldDataType> = {
  boolean: "boolean",
  bool: "boolean",
  tinyint: "number",
  smallint: "number",
  integer: "number",
  int: "number",
  bigint: "number",
  decimal: "number",
  numeric: "number",
  real: "number",
  double: "number",
  "double precision": "number",
  serial: "number",
  bigserial: "number",
  money: "number",
  float: "number",
  text: "string",
  uuid: "uuid",
  date: "date",
  timestamp: "timestamp",
  timestamptz: "timestamp",
  json: "json",
  jsonb: "json",
  varchar: "string",
  "character varying": "string",
  citext: "string",
  inet: "string",
};

const toCamelCase = (value: string) =>
  value.replace(/_([a-z])/g, (_, char) => char.toUpperCase());

const toSnakeCase = (value: string) =>
  value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

const columnVariants = (column: string | undefined) => {
  if (!column) return [];
  const normalized = column.trim();
  if (!normalized) return [];
  return [
    normalized,
    toCamelCase(normalized),
    toSnakeCase(normalized),
  ];
};

const getColumnMeta = (
  table: SnapshotTable | undefined,
  column: string,
): SnapshotColumn | undefined => {
  if (!table) return undefined;
  const columns = table.columns as Record<string, SnapshotColumn> | undefined;
  if (!columns) return undefined;
  for (const variant of columnVariants(column)) {
    const match = columns[variant];
    if (match) return match;
  }
  return undefined;
};

const tryTableKeys = (table?: string) => {
  if (!table) return [];
  const trimmed = table.trim();
  const camel = toCamelCase(trimmed);
  const snake = toSnakeCase(trimmed);
  return [
    trimmed,
    `public.${trimmed}`,
    trimmed.toLowerCase(),
    `public.${trimmed.toLowerCase()}`,
    camel,
    `public.${camel}`,
    snake,
    `public.${snake}`,
  ];
};

const getSnapshotTable = (table?: string) => {
  const keys = tryTableKeys(table);
  for (const key of keys) {
    const entry = schemaSnapshot.tables[key as keyof SchemaSnapshot["tables"]];
    if (entry) return entry as SnapshotTable;
  }
  return undefined;
};

const normalizeSqlType = (sqlType?: string): string => {
  if (!sqlType) return "";
  return sqlType.toLowerCase().replace(/\s*\(.+\)/, "").trim();
};

const mapSqlTypeToFieldType = (sqlType: string | undefined): FieldInputType | undefined => {
  const normalized = normalizeSqlType(sqlType);
  if (!normalized) return undefined;
  return TYPE_TO_FIELD_TYPE[normalized];
};

const mapSqlTypeToFieldDataType = (sqlType: string | undefined): FieldDataType | undefined => {
  const normalized = normalizeSqlType(sqlType);
  if (!normalized) return undefined;
  return TYPE_TO_FIELD_DATATYPE[normalized];
};

export const getDrizzleColumnMeta = (
  table?: DrizzleTableName | string,
  column?: string,
): SnapshotColumn | undefined => {
  if (!table || !column) return undefined;
  const tableMeta = getSnapshotTable(table);
  if (!tableMeta) return undefined;
  return getColumnMeta(tableMeta, column);
};

export const isDrizzleColumnNullable = (
  table?: DrizzleTableName | string,
  column?: string,
): boolean | undefined => {
  const meta = getDrizzleColumnMeta(table, column);
  if (!meta) return undefined;
  if (typeof meta.notNull === "boolean") {
    return !meta.notNull;
  }
  return undefined;
};

export const getDrizzleColumnDefault = (
  table?: DrizzleTableName | string,
  column?: string,
): string | undefined => {
  return getDrizzleColumnMeta(table, column)?.default;
};

export const getDrizzleFieldType = (
  table?: DrizzleTableName | string,
  column?: string,
): FieldInputType | undefined => {
  if (!table || !column) return undefined;
  const tableMeta = getSnapshotTable(table);
  if (!tableMeta) return undefined;
  const columnMeta = getColumnMeta(tableMeta, column);
  if (!columnMeta) return undefined;
  return mapSqlTypeToFieldType(columnMeta.type);
};

export const getDrizzleEditorType = (
  table?: DrizzleTableName | string,
  column?: string,
): "text" | "number" | "boolean" | undefined => {
  const fieldType = getDrizzleFieldType(table, column);
  if (fieldType === "boolean") return "boolean";
  if (fieldType === "number") return "number";
  if (fieldType === "text") return "text";
  if (fieldType === "date") return "text";
  return undefined;
};

export const getDrizzleColumnInfo = (
  table?: DrizzleTableName | string,
  column?: string,
): {
  dataType?: FieldDataType;
  fieldType?: FieldInputType;
  isNullable?: boolean;
} => {
  if (!table || !column) return {};
  const tableMeta = getSnapshotTable(table);
  if (!tableMeta) return {};
  const columnMeta = getColumnMeta(tableMeta, column);
  if (!columnMeta) return {};
  return {
    dataType: mapSqlTypeToFieldDataType(columnMeta.type),
    fieldType: mapSqlTypeToFieldType(columnMeta.type),
    isNullable: columnMeta.notNull !== true,
  };
};

