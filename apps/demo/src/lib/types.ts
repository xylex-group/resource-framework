export type FormStateData = Record<string, unknown>;

export type ColumnConfigObject = {
  column_name: string;
  hidden?: boolean;
  cell_value_mask_label?: string;
  [key: string]: unknown;
};

export type ColumnConfiguration = ColumnConfigObject;

export type FetchCondition = {
  eq_column: string;
  eq_value: string | number | boolean | null;
};

export type RemoteResourceRouteResponse = Record<string, unknown>;
export type ResourceData = Record<string, unknown>;
export type SelectOption = {
  label: string;
  value: string | number | boolean;
};
