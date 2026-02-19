"use client";

import { type ComponentType, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { DrizzleTableName } from "./types/drizzle-schema";

export type ResourceRouteRegistry = Record<string, ResourceRouteEntry>;

// ============================================================================
// CORE RESOURCE TYPES
// ============================================================================
export type DateInputMode = "date" | "datetime" | "unixtime";

export type ResourceRouteEntry = {
  name: string;
  title?: string;
  path?: string;
  drilldownPathTemplate?: string;
  columns?: Array<BuiltColumnSpec | string>;
};

export type ResourceDrilldownConfig = {
  autoHideEmptyColumns?: boolean;
  summaryPaddingClass?: string;
};

export type NewResourceContext = {
  user: Record<string, unknown>;
  router: Record<string, unknown>;
  clearState?: () => void;
  // the `setInvoice` & `setQuote` & `setLineItems`
  setInvoice?: (inv: Record<string, unknown>) => void;
  setQuote?: (quote: Record<string, unknown>) => void;
  setLineItems?: (li: Record<string, unknown>[]) => void;
  // end
  setLoading?: (b: boolean) => void;
  setError?: (err: string) => void;
};

export type ResourceCreateConfig = {
  scope: string | string[];
  showButtonScope?: string | string[];
  required: string[];
  optional?: string[];
  columns?: Array<ColumnConfig>;
  dialog?: ComponentType<{
    onSubmit(values: Record<string, unknown>): void;
    onCancel(): void;
    initial?: Partial<Record<string, unknown>>;
  }>;
};

export type ResourceRoute = {
  table: string;
  idColumn: string;
  drizzleTable?: DrizzleTableName;
  path?: string;
  force_no_cache?: boolean;
  force_external_api_updates?: boolean;
  categories?: string[];
  schema?: string;
  permanent_edit_state?: boolean;
  force_remove_back_button_store_on_index_resource?: boolean;
  enableSearch?: boolean;
  searchBy?: string;
  sidebar_route?: string;
  avatar_column?: string;
  icon?: string;
  create?: ResourceCreateConfig;
  enableNewResourceCreation?: boolean;
  newResourceButtonText?: string;
  newResourceHref?: string;
  newResourceOnClick?: (ctx: NewResourceContext) => Promise<void> | void;
  page_label?: string;
  forceWrappingHeaderLabels?: boolean;
  disableCompanyFilter?: boolean;
  drilldownRoutePrefix?: string;
  drilldownHref?: string | ((row: Record<string, unknown>) => string);
  deferToHeader?: boolean;
  deferTitleToHeader?: boolean;
  deferSubtitleToHeader?: boolean;
  deferNewButtonToHeader?: boolean;
  columns?: Array<
    | string
    | {
        column_name: string;
        header?: string;
        header_label?: string;
        use?: string;
        order?: number;
        href?: string;
        hidden?: boolean;
        label?: string;
        cell_value_mask_label?: string;
        formatter?: (value: unknown, row: Record<string, unknown>) => unknown;
        minWidth?: number;
        maxWidth?: number;
        widthFit?: boolean;
        data_type?: FieldDataType;
        editable?: {
          type: "text" | "select" | "boolean" | "textarea";
          update_table?: string;
          update_id_column?: string;
          update_column?: string;
          options?: Array<{ label: string; value: string | number | boolean }>;
          data_source?: string | { table: string; column: string };
        };
      }
  >;
  companyIdColumn?: string;
  filterableColumnBlacklist?: string[];
  edit?: {
    enabled?: boolean;
    allowedColumns?: string[];
    deniedColumns?: string[];
    scope?: string;
    IgnoreCompanyCheckBeforeMutation?: boolean;
  };
  rowActions?: Array<
    | {
        label: string;
        onClick: (row: Record<string, unknown>) => void;
        destructive?: boolean;
        disabled?: (row: Record<string, unknown>) => boolean | boolean;
      }
    | { type: "separator" }
  >;
  customComponent?: ComponentType<Record<string, unknown>>;
  drilldownCustomComponent?: ComponentType<Record<string, unknown>>;
  chat?: {
    table: string;
    foreignKeyColumn: string;
    messageColumn?: string;
    authorUserIdColumn?: string;
  };
  drilldown?: ResourceDrilldownConfig;
};

export type FieldDataType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "json"
  | "timestamp"
  | "uuid"
  | "other";

export type FieldInputType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "date"
  | "textarea";

export type DataSourceRef = string | { table: string; column: string };

export type SelectOption = {
  value: string | number | boolean;
  label: string;
};

export type ResourceFieldSpec = {
  column_name: string;
  header?: string;
  header_label?: string;
  label?: string;
  href?: string;
  hidden?: boolean;
  category?: string;
  order?: number;
  minWidth?: number;
  maxWidth?: number;
  widthFit?: boolean;
  cell_value_mask_label?: string;
  formatter?: (
    value: unknown,
    row: Record<string, unknown>,
  ) => ReactNode | string | number | null | undefined;
  use?: string;
  data_type?: FieldDataType;
  field_type?: FieldInputType;
  options?: SelectOption[];
  data_source?: DataSourceRef;
  editor?: {
    data_source: DataSourceRef;
  };
  editable?: {
    type?: "text" | "textarea" | "select" | "boolean";
    update_table?: string;
    update_id_column?: string;
    update_column?: string;
    options?: Array<{ label: string; value: string | number | boolean }>;
    data_source?: DataSourceRef;
  };
  update_table?: string;
  update_id_column?: string;
  update_column?: string;
};

/**
 * BuiltColumnSpec represents a simple configuration object for column metadata.
 * Used by `defineColumns` to specify column properties without TanStack Table specifics.
 *
 * This is NOT the same as a TanStack ColumnDef - it's a simpler config structure.
 * Use this when you need to define column metadata at a high level.
 *
 * @example
 * ```tsx
 * const columns: BuiltColumnSpec[] = defineColumns([
 *   { column_name: 'name', field_type: 'text', order: 1 }
 * ]);
 * ```
 */
export type BuiltColumnSpec = {
  column_name: string;
  header?: string;
  header_label?: string;
  use?: string;
  order?: number;
  href?: string;
  hidden?: boolean;
  label?: string;
  category?: string;
  cell_value_mask_label?: string;
  formatter?: (value: unknown, row: Record<string, unknown>) => unknown;
  minWidth?: number;
  maxWidth?: number;
  widthFit?: boolean;
  data_type?: FieldDataType;
  editable?: {
    type: "text" | "textarea" | "select" | "boolean";
    update_table?: string;
    update_id_column?: string;
    update_column?: string;
    options?: Array<{ label: string; value: string | number | boolean }>;
    data_source?: string | { table: string; column: string };
  };
};

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "in"
  | "not_in"
  | "is_null"
  | "is_not_null";

export type FilterDefinition = {
  operators: FilterOperator[];
};

export type FilterRegistry = Record<
  "string" | "number" | "boolean" | "date" | "json" | "other",
  FilterDefinition
>;

export type FilterOption = {
  label: string;
  value: string | number | boolean;
};

// ============================================================================
// DRILLDOWN TYPES
// ============================================================================

export type ResourceDrilldownRoute = {
  title?: (row: Record<string, unknown>) => string;
  subtitle?: (row: Record<string, unknown>) => string;
  titleIcon?: (row: Record<string, unknown>) => ReactNode;
  backLabel?: string | ((resourceName: string) => string);
  actions?: DrilldownAction[];
  sections?: DrilldownSectionConfig[];
  pathTemplate?: string;
  autoHideEmptyColumns?: boolean;
  paddingBottom?: number;
  deferToHeader?: boolean;
  deferTitleToHeader?: boolean;
  deferSubtitleToHeader?: boolean;
  deferTitleIconToHeader?: boolean;
};

export type ResourceDrilldownRegistry = Record<string, ResourceDrilldownRoute>;

export type DrilldownField =
  | string
  | {
      key: string;
      label?: string;
      hidden?: boolean;
      field_type?: FieldInputType;
      options?: SelectOption[];
    };

/**
 * Title size options for table widgets and responsive tables.
 * Maps to the TitleSize enum in components/ui-responsive/responsive-table.tsx
 */
export type TitleSize = "small" | "medium" | "large";

/**
 * Base widget spec with common properties.
 * Widget-specific specs extend this with discriminated union on `type`.
 */
type BaseWidgetSpec = {
  id?: string;
};

/**
 * Table widget specification with typed props.
 */
export type TableWidgetSpec = BaseWidgetSpec & {
  type: "table";
  props?: TableWidgetProps;
};

/**
 * JSON widget specification (built-in widget type).
 */
export type JsonWidgetSpec = BaseWidgetSpec & {
  type: "json";
  props?: {
    title?: string;
    description?: string;
    blockClassName?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

/**
 * Chart widget specification with typed props.
 */
export type ChartWidgetSpec = BaseWidgetSpec & {
  type: "chart";
  props?: ChartWidgetProps;
};

/**
 * Discriminated union of all widget specifications.
 * Add new widget types here as needed.
 */
export type DrilldownSectionWidgetSpec =
  | TableWidgetSpec
  | JsonWidgetSpec
  | FileExplorerWidgetSpec
  | ChartWidgetSpec
  | (BaseWidgetSpec & {
      type: string;
      props?: Record<string, unknown>;
    });

export type S3Provider = "aws" | "digital_ocean" | "hetzner" | "minio";

export type S3ClientConfig = {
  bucket_name: string;
  access_key: string;
  secret_key: string;
  use_ssl?: boolean;
  provider: S3Provider;
  base_url: string;
};

export type FileExplorerWidgetProps = {
  table?: string;
  conditions?: TableWidgetCondition[];
  title?: string;
  uploadDir?: string;
  projectId?: string;
  bucket?: string;
  resourceName?: string;
  objectPath?: string;
  maxFileSizeMB?: number;
  acceptedTypes?: string[];
  allowUpload?: boolean;
  allowDelete?: boolean;
  limit?: number;
  columns?: string[];
  fileIdColumn?: string;
  organizationIdColumn?: string;
  resourceIdColumn?: string;
  s3_client?: S3ClientConfig;
};

export type FileExplorerWidgetSpec = BaseWidgetSpec & {
  type: "file_explorer";
  props?: FileExplorerWidgetProps;
};

export type ChartWidgetProps = {
  title?: string;
  chartType?: string;
  targetColumn?: string;
  calculationStrategy?: string;
  xAxisGroupBy?: string;
  conditions?: TableWidgetCondition[];
  resourceName?: string;
  dataEndpoint?: string;
  eqColumn?: string;
  eqValue?: string;
  resourceIdColumn?: string;
  organizationIdColumn?: string;
  limit?: number;
  columns?: string[];
  table?: string;
  schema?: string;
  projectId?: string;
  objectPath?: string;
  bucket?: string;
  description?: string;
  height?: string | number;
  color?: string;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  dateFormat?: string;
  valueFormat?: string;
  aggregation?: "sum" | "avg" | "count" | "min" | "max";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  emptyMessage?: string;
  showPeriodSelector?: boolean;
  periodOptions?: Array<"7d" | "30d" | "90d" | "6m" | "1y" | "ytd" | "all">;
  defaultPeriod?: "7d" | "30d" | "90d" | "6m" | "1y" | "ytd" | "all";
  [key: string]: unknown;
};

export type TableWidgetCondition = {
  eq_column: string;
  eq_value: string | number | boolean | null;
};

export type TableWidgetCreateConfig = Partial<
  Pick<
    ResourceCreateConfig,
    "scope" | "showButtonScope" | "columns" | "required" | "optional" | "dialog"
  >
> & {
  defaultValues?: Partial<Record<string, Primitive>>;
};

export type TableWidgetProps = {
  resourceName: string;
  conditions?: TableWidgetCondition[];
  title?: string;
  titleSize?: TitleSize;
  enableSearch?: boolean;
  enableFilters?: boolean;
  enablePagination?: boolean;
  enableAddButton?: boolean;
  enableDownload?: boolean;
  limit?: number;
  columns?: string[];
  create?: TableWidgetCreateConfig;
};

export type DrilldownSectionConfig = {
  title: string;
  columns?: 1 | 2 | 3 | 4;
  fields: DrilldownField[];
  widgets?: DrilldownSectionWidgetSpec[];
  expose_to_edit_state?: boolean;
};

export type DrilldownAction =
  | {
      label: string;
      onClick: (row: Record<string, unknown>) => void;
      destructive?: boolean;
      disabled?: (row: Record<string, unknown>) => boolean | boolean;
    }
  | { type: "separator" };

// ============================================================================
// FORM TYPES (V1)
// ============================================================================

export interface FormField {
  key: string;
  label: string;
  type:
    | "text"
    | "email"
    | "date"
    | "tel"
    | "number"
    | "select"
    | "radio"
    | "textarea"
    | "file"
    | "checkbox"
    | "table"
    | "note"
    | "switch"
    | "calculated"
    | "conditional_note"
    | "country_code"
    | "file_explorer"
    | "card_select"
    | "plan_select"
    | "pay_stripe";
  options?: string[];
  defaultValue?: string;
  columns?: string[];
  content?: string;
  condition?: string;
  error_key?: string;
  required: boolean;
  min?: number;
  max?: number;
  step_size?: number;
  fromDate?: string;
}

export interface EntityStep {
  [stepName: string]: FormField[];
}

export interface EntitySchema {
  entity: string;
  steps: EntityStep;
}

export type FormData = Record<string, unknown>;

// ============================================================================
// FORM TYPES (V2)
// ============================================================================

export type ResourceFormFieldType =
  | "text"
  | "tel"
  | "date"
  | "number"
  | "card_select"
  | "plan_select"
  | "pay_stripe"
  | "country"
  | "text_area"
  | "file_upload"
  | "dob";

export interface TextLikeResourceFormField {
  key: string;
  label: string;
  type: "text" | "tel" | "date" | "number" | "dob";
  required?: boolean;
  autocomplete?: string;
  min?: number;
  max?: number;
  step_size?: number;
}

export interface CardSelectOption {
  title: string;
  value: string;
  description?: string;
  subheading?: string;
  footer?: string;
  badge?: string;
}

export interface CardSelectResourceFormField {
  key: string;
  label: string;
  type: "card_select";
  required?: boolean;
  options: CardSelectOption[];
}

export interface PlanSelectOption {
  title: string;
  value: string;
  price: string;
  cadence: string;
  features: string[];
  badge?: string;
  footer?: string;
}

export interface PlanSelectResourceFormField {
  key: string;
  label: string;
  type: "plan_select";
  required?: boolean;
  options: PlanSelectOption[];
}

export interface PayStripeResourceFormField {
  key: string;
  label: string;
  type: "pay_stripe";
  required?: boolean;
}

export interface CountryResourceFormField {
  key: string;
  label: string;
  type: "country";
  required?: boolean;
}

export interface TextAreaResourceFormField {
  key: string;
  label: string;
  type: "text_area";
  required?: boolean;
  max_length?: number;
}

export interface FileUploadResourceFormField {
  key: string;
  label: string;
  type: "file_upload";
  required?: boolean;
  document_type?: string;
}

export type ResourceFormField =
  | TextLikeResourceFormField
  | CardSelectResourceFormField
  | PlanSelectResourceFormField
  | PayStripeResourceFormField
  | CountryResourceFormField
  | TextAreaResourceFormField
  | FileUploadResourceFormField;

export interface ResourceFormSchema {
  entity: string;
  steps: {
    [stepKey: string]: ResourceFormField[];
  };
  step_order?: string[];
  show_submit_button?: boolean;
}

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export interface UserPreference {
  id?: number;
  user_preference_id?: string;
  user_id?: string;
  table_name?: string;
  settings?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface UserPermissionScope {
  user_id?: string;
  scope?: string;
  enabled?: boolean;
  global?: boolean;
  company_id?: string;
}

export interface Notification {
  notification_id?: string;
  id?: string;
  company_id?: string;
  read?: boolean;
  title?: string;
  message?: string;
  created_at?: string;
  [key: string]: unknown;
}

/**
 * @deprecated FlagsViewRow is deprecated. Use UserPermissionScope instead.
 */
export interface FlagsViewRow {
  user_id?: string;
  flags?: string[] | string | null;
}

export interface ResourceContextValue {
  userPreferences: UserPreference[];
  userScopes: string[];
  notifications: Notification[];
  /**
   * @deprecated flags array is deprecated and will be removed in a future version.
   * Use userScopes instead for permission checks.
   */
  flags: string[];
  hasScope: (scope: string | string[], opts?: { all?: boolean }) => boolean;
  /**
   * @deprecated hasFlag is deprecated and will be removed in a future version.
   * Use hasScope() instead for permission checks.
   * Migration: Replace hasFlag('feature_name') with hasScope('feature_name')
   */
  hasFlag: (flag: string) => boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export interface ResourceProviderProps {
  children: ReactNode;
  cacheEnabled?: boolean;
}

// ============================================================================
// DIALOG TYPES
// ============================================================================

export type Primitive = string | number | boolean | null | undefined;

export type FieldEditorSpec = {
  type?: "text" | "number" | "boolean" | "select" | "date";
  options?: Array<{ label: string; value: string | number | boolean }>;
  data_source?:
    | string
    | {
        table: string;
        value_column?: string;
        label_column?: string;
        search_column?: string;
      };
};

export type FieldSpec =
  | string
  | {
      column_name: string;
      label?: string;
      header?: string;
      header_label?: string;
      hidden?: boolean;
      data_type?: string;
      default_value?: Primitive;
      editor?: FieldEditorSpec;
    };

// ============================================================================
// QUERY TYPES
// ============================================================================

export type QuerySort = {
  id: string;
  desc: boolean;
} | null;

export type QueryFilter = {
  column: string;
  op: string;
  value: unknown;
};

// ============================================================================
// USER SCOPE TYPES
// ============================================================================

// Re-export from hooks for backward compatibility
export type { UserScopeRecord } from "@/hooks/use-user-scopes";

// ============================================================================
// COMPONENT-SPECIFIC TYPES
// ============================================================================

export type Assignee = {
  email?: string;
  avatar?: string;
  user_id?: string;
  username?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
};

export type FormationInfo = {
  label: string;
  country: string;
};

export type ColumnMeta = {
  name: string;
  data_type?: string;
  format?: string;
  is_nullable?: boolean;
};

export type ResourceFormRow = {
  resource_form_id: string;
  slug: string;
  entity: string;
  source_schema_url?: string | null;
  source_schema?: Record<string, unknown>;
  source_schema_provider?: string | null;
  schema?: Record<string, unknown>;
  is_active?: boolean;
};

/**
 * RegistryRenderer defines a column builder in the global column registry.
 *
 * IMPORTANT: The `build` function MUST return a TanStack ColumnDef<TData>, NOT a BuiltColumnSpec.
 * This ensures type safety across all column builders in column-registry.tsx.
 *
 * Each builder function constructs a complete TanStack Table column definition with:
 * - header: Function or string for column header
 * - accessorKey: The data key
 * - cell: React component for rendering cell content
 * - sortingFn: Optional custom sorting function
 * - filterFn: Optional custom filtering function
 * - meta: Additional metadata (datatype, filterable, etc.)
 * - column_name: The column identifier
 *
 * @example
 * ```tsx
 * const statusRenderer: RegistryRenderer<MyData> = {
 *   build: (opts) => ({
 *     header: () => <span>{opts.header ?? 'Status'}</span>,
 *     accessorKey: opts.key as string,
 *     cell: ({ row }) => <Badge>{row.original[opts.key]}</Badge>,
 *     column_name: opts.key as string,
 *   }),
 *   order: 2,
 *   filterable: true,
 *   datatype: 'string',
 * };
 * ```
 */
export type RegistryRenderer<TData> = {
  build: (opts: {
    key: Extract<keyof TData, string | number>;
    header?: string;
  }) => ColumnDef<TData>;
  order?: number;
  filterable?: boolean;
  datatype?: "string" | "number" | "boolean" | "date" | "json" | "other";
};

/**
 * ColumnRegistry maps column keys to their renderer definitions.
 * Used by buildColumnsFromRegistry to resolve column builders dynamically.
 */
export type ColumnRegistry<TData> = Record<string, RegistryRenderer<TData>>;

export type LeanColumnSpec<TData> =
  | keyof TData
  | {
      key: Extract<keyof TData, string | number>;
      header?: string;
      use?: string;
      order?: number;
      label?: string;
      href?: string;
      cell_value_mask_label?: string;
      formatter?: (value: unknown, row: TData) => unknown;
      minWidth?: number;
      maxWidth?: number;
      widthFit?: boolean;
      enableNoSelect?: boolean;
      enableNoWrap?: boolean;
      viewHook?: (row: TData) => unknown;
      viewRender?: (viewResult: unknown, row: TData) => ReactNode;
      editor?: {
        type?: "text" | "number" | "boolean" | "select";
        options?: Array<{ label: string; value: string | number | boolean }>;
        data_source?:
          | string
          | {
              table: string;
              value_column?: string;
              label_column?: string;
              search_column?: string;
            };
      };
    };

export type FieldValue = Primitive;

export type FieldValueMap = Partial<Record<string, FieldValue>>;

export function buildFieldDefaultsFromColumns(
  columns?: Array<ColumnConfig>,
  overrides: FieldValueMap = {},
): FieldValueMap {
  const defaults: FieldValueMap = {};
  if (Array.isArray(columns)) {
    for (const column of columns) {
      const colConfig =
        typeof column === "string" ? { column_name: column } : column;
      if (
        colConfig &&
        typeof colConfig === "object" &&
        colConfig.column_name &&
        "default_value" in colConfig
      ) {
        defaults[colConfig.column_name] = colConfig.default_value;
      }
    }
  }
  return { ...defaults, ...overrides };
}

export type ColumnConfig =
  | string
  | {
      column_name: string;
      header?: string;
      header_label?: string;
      hidden?: boolean;
      data_type?: string;
      nullable?: boolean;
      default_value?: FieldValue;
      editor?: {
        type?: "text" | "number" | "boolean" | "select" | "date";
        options?: Array<{ label: string; value: string | number | boolean }>;
        data_source?:
          | string
          | {
              table: string;
              value_column?: string;
              label_column?: string;
              search_column?: string;
            };
      };
    };

export type ResourceRouteRow = {
  table?: string;
  page_label?: string;
  enable_new_resource_creation?: boolean;
  new_resource_button_text?: string;
  new_resource_href?: string;
  force_no_cache?: boolean;
  columns?: Record<string, unknown>;
  new_resource_mandatory_columns?: Record<string, unknown>;
  new_resource_optional_columns?: Record<string, unknown>;
};

export interface EditableConfig {
  type?: "text" | "select" | "boolean";
  options?: Array<{ label: string; value: string | number }>;
  update_table?: string;
  update_id_column?: string;
  update_column?: string;
}

export interface DrilldownSummaryItemProps {
  label?: string;
  value?: ReactNode;
  className?: string;
  entity?: Record<string, unknown>;
  keyName?: string;
  use?: string;
  header?: string;
  formatter?: (value: unknown, row: Record<string, unknown>) => unknown;
  isEditing?: boolean;
  editable?: EditableConfig;
  entityId?: string | number;
  tableName?: string;
  idColumn?: string;
}
