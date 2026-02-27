export type FormStateData = Record<string, unknown>;

export type EditorConfig = {
  type?: string;
  options?: { label: string; value: string }[];
  update_column?: string;
  data_source?: string;
  update_table?: string;
  update_id_column?: string;
};

export type ColumnConfigObject = {
  column_name: string;
  hidden?: boolean;
  cell_value_mask_label?: string;
  editable?: EditorConfig;
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
export type DataSourceConfig = {
  table: string;
  value_column?: string;
  label_column?: string;
  order_by?: string;
  limit?: number;
} | string;
