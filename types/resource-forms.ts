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

export type ResourceFormRow = {
  resource_form_id: string;
  slug: string;
  title?: string;
  description?: string;
  entity: string;
  schema_version?: number | null;
  migration_key?: string | null;
  source_schema_url?: string | null;
  source_schema?: Record<string, unknown>;
  source_schema_provider?: string | null;
  schema?: Record<string, unknown>;
  default_values?: Record<string, unknown> | null;
  is_active?: boolean;
  sort_order?: number | null;
};
