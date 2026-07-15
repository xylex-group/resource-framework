import type { ModelColumnMetadata } from "@xylex-group/athena/browser";
import type { FieldDataType, FieldInputType } from "../resource-types";
import {
  resourceModels,
  type AthenaResourceModelName,
} from "./models/resource-models";

const MODEL_ALIASES: Record<string, AthenaResourceModelName> = {
  demo_contacts: "demoContacts",
  customer_jurisdictions: "customerJurisdictions",
  customerJurisdictions: "customerJurisdictions",
  gl_accounts: "glAccounts",
  glAccounts: "glAccounts",
  products: "products",
  customers: "customers",
  invoices: "invoices",
};

function resolveModel(name?: string) {
  if (!name) return undefined;
  const modelName = MODEL_ALIASES[name] ?? name;
  return resourceModels[modelName as AthenaResourceModelName];
}

function resolveColumn(
  modelName: string | undefined,
  columnName: string | undefined,
): ModelColumnMetadata | undefined {
  if (!columnName) return undefined;
  return resolveModel(modelName)?.meta.columns?.[columnName];
}

function toInputType(column?: ModelColumnMetadata): FieldInputType | undefined {
  if (!column) return undefined;
  if (column.kind === "boolean") return "boolean";
  if (column.kind === "number") return "number";
  return "text";
}

function toDataType(column?: ModelColumnMetadata): FieldDataType | undefined {
  if (!column) return undefined;
  if (column.kind === "boolean") return "boolean";
  if (column.kind === "number") return "number";
  if (column.kind === "json") return "json";
  return "string";
}

export function getAthenaColumnMetadata(model?: string, column?: string) {
  return resolveColumn(model, column);
}

export function getAthenaFieldType(
  model?: string,
  column?: string,
): FieldInputType | undefined {
  return toInputType(resolveColumn(model, column));
}

export function getAthenaEditorType(
  model?: string,
  column?: string,
): "text" | "number" | "boolean" | undefined {
  return getAthenaFieldType(model, column) as
    | "text"
    | "number"
    | "boolean"
    | undefined;
}

export function getAthenaColumnInfo(model?: string, column?: string) {
  const metadata = resolveColumn(model, column);
  return {
    dataType: toDataType(metadata),
    fieldType: toInputType(metadata),
    isNullable: metadata?.nullable,
  };
}
