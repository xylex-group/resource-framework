"use client";

type AnyDrizzleTable = {
  $inferSelect: unknown;
  _: unknown;
};

type SchemaTables = Record<string, AnyDrizzleTable>;

export type DrizzleTableName =
  | (keyof SchemaTables & string)
  | "demo_contacts"
  | "customerJurisdictions"
  | "glAccounts"
  | "products"
  | "customers"
  | "invoices";

type BaseColumnKeys<TTable extends DrizzleTableName> =
  & keyof SchemaTables[TTable][
    "$inferSelect"
  ]
  & string;

type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : S;

type SnakeCaseInner<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Lowercase<First> ? `${First}${SnakeCaseInner<Rest>}`
  : `_${Lowercase<First>}${SnakeCaseInner<Rest>}`
  : S;

type SnakeCase<S extends string> = SnakeCaseInner<S> extends `_${infer Trimmed}`
  ? Trimmed
  : SnakeCaseInner<S>;

type ColumnNameVariants<S extends string> = S | CamelCase<S> | SnakeCase<S>;

export type DrizzleColumnName<TTable extends DrizzleTableName> =
  ColumnNameVariants<BaseColumnKeys<TTable>>;

type TableRow<TTable extends DrizzleTableName> =
  SchemaTables[TTable]["$inferSelect"];

export type DrizzleColumnValue<
  TTable extends DrizzleTableName,
  TColumn extends DrizzleColumnName<TTable>,
> = TColumn extends keyof TableRow<TTable> ? TableRow<TTable>[TColumn] : never;

type InferDrizzleFieldType<TRowValue> =
  TRowValue extends boolean ? "boolean"
    : TRowValue extends number ? "number"
      : "text";

export type DrizzleColumnFieldType<
  TTable extends DrizzleTableName,
  TColumn extends DrizzleColumnName<TTable>,
> = InferDrizzleFieldType<DrizzleColumnValue<TTable, TColumn>>;
