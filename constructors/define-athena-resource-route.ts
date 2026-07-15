"use client";

import type { BuiltColumnSpec, ResourceFieldSpec, ResourceRoute } from "../resource-types";
import type {
  AthenaResourceModelColumn,
  AthenaResourceModelName,
  AthenaResourceModelRow,
} from "../athena/models/resource-models";
import { defineColumns } from "./define-columns";

export type AthenaResourceFieldSpec<
  TModel extends AthenaResourceModelName,
  TColumn extends AthenaResourceModelColumn<TModel> = AthenaResourceModelColumn<TModel>,
> = Omit<ResourceFieldSpec, "column_name"> & {
  column_name: TColumn;
  field_type?: AthenaResourceModelRow<TModel>[TColumn] extends boolean
    ? "boolean"
    : AthenaResourceModelRow<TModel>[TColumn] extends number
      ? "number"
      : ResourceFieldSpec["field_type"];
};

export type AthenaBuiltColumnSpec<TModel extends AthenaResourceModelName> =
  Omit<BuiltColumnSpec, "column_name"> & {
    column_name: AthenaResourceModelColumn<TModel>;
  };

export type AthenaResourceRoute<TModel extends AthenaResourceModelName> =
  Omit<ResourceRoute, "athenaModel" | "idColumn" | "companyIdColumn" | "columns"> & {
    athenaModel?: TModel;
    idColumn: AthenaResourceModelColumn<TModel>;
    companyIdColumn?: AthenaResourceModelColumn<TModel>;
    columns?: Array<string | AthenaBuiltColumnSpec<TModel>>;
  };

export function defineAthenaResourceRoute<TModel extends AthenaResourceModelName>(
  model: TModel,
  route: AthenaResourceRoute<TModel>,
): ResourceRoute {
  return { ...route, athenaModel: model } as ResourceRoute;
}

export function defineAthenaColumns<TModel extends AthenaResourceModelName>(
  specs: AthenaResourceFieldSpec<TModel>[],
): AthenaBuiltColumnSpec<TModel>[] {
  return defineColumns(specs as ResourceFieldSpec[]) as AthenaBuiltColumnSpec<TModel>[];
}
