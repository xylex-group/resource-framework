"use client";

import {
  defineColumns,
  defineDrizzleResourceRoute,
  type ResourceFieldSpec,
  type ResourceRoute,
  type ResourceRouteEntry,
  type ResourceRouteRegistry,
} from "@/packages/resource-framework";
import { type BuiltColumnSpec } from "@/packages/resource-framework/resource-types";

export const resourceRoutes: ResourceRouteRegistry = {};

import { countryCodes, timezoneKeys } from "@/lib/constants";
import {
  getDrizzleColumnInfo,
  getDrizzleColumnMeta,
} from "@/packages/resource-framework/utils/drizzle-editor";

const customerJurisdictionDataSource = {
  table: "customer_jurisdictions",
  value_column: "customer_jurisdiction_id",
  label_column: "name",
  search_column: "name",
} as const;

const customersDataSource = {
  table: "customers",
  value_column: "customer_id",
  label_column: "name",
} as const;

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
  customer_jurisdictions: {
    table: "customer_jurisdictions",
    idColumn: "customer_jurisdiction_id",
    companyIdColumn: "organization_id",
    columns: defineColumns([
      {
        column_name: "organization_id",
        hidden: true,
        data_type: "string",
      },
      {
        column_name: "customer_jurisdiction_id",
        data_type: "uuid",
        hidden: true,
      },
      {
        column_name: "name",
        data_type: "string",
        order: 1,
      },
      {
        column_name: "country_code",
        data_type: "string",
        order: 3,
      },
      {
        column_name: "global",
        data_type: "boolean",
        field_type: "boolean",
      },
      {
        column_name: "enabled",
        data_type: "boolean",
        order: 2,
        field_type: "boolean",
      },
      {
        column_name: "description",
        data_type: "string",
      },
      {
        column_name: "color",
        data_type: "string",
      },
    ]),
    drizzleTable: "customerJurisdictions",
    enableNewResourceCreation: true,
    create: {
      required: ["name"],
      scope: "",
      columns: [{ column_name: "name" }],
      optional: [],
    },
    schema: "public",
  },
  gl_accounts: {
    table: "gl_accounts",
    idColumn: "gl_account_id",
    companyIdColumn: "organization_id",
    create: {
      required: ["name"],
      scope: "",

      columns: ["name"],
      optional: ["code", "is_ar", "is_ap", "is_vat_payable"],
    },
    drizzleTable: "glAccounts",
    enableNewResourceCreation: true,
    searchBy: "name,code",
    deferNewButtonToHeader: true,
    deferSubtitleToHeader: true,
    deferTitleToHeader: true,
    deferToHeader: true,

    enableSearch: true,
    edit: {
      enabled: true,
      deniedColumns: [
        "organization_id",
        "gl_account_id",
        "rid",
        "created_at",
        "time",
        "id",
      ],
    },
    force_remove_back_button_store_on_index_resource: true,
    drilldown: {
      autoHideEmptyColumns: true,
    },
    columns: [
      { column_name: "id", hidden: true },
      { column_name: "gl_account_id", hidden: true },
      { column_name: "code", order: 2 },
      { column_name: "name", order: 1 },
      { column_name: "description" },
      { column_name: "category", order: 4 },
      { column_name: "subcategory" },
      { column_name: "currency", order: 3 },
      {
        column_name: "is_postable",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
      },
      {
        column_name: "is_active",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
      },
      {
        column_name: "credit_or_debit",
        data_type: "string",
        editable: {
          type: "select",
          options: [
            { label: "Credit", value: "credit" },
            { label: "Debit", value: "debit" },
          ],
        },
      },
      {
        column_name: "is_ar",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
      },
      {
        column_name: "is_ap",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
      },
      {
        column_name: "is_revenue",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
      },
      {
        column_name: "is_expense",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
      },
      {
        column_name: "is_vat_payable",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
      },
      {
        column_name: "is_vat_receivable",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
      },
    ],
  },

  products: {
    table: "products",
    idColumn: "product_id",
    companyIdColumn: "organization_id",
    force_remove_back_button_store_on_index_resource: true,
    drilldownRoutePrefix: "/v2/products",
    page_label: "Products",
    drizzleTable: "products",
    schema: "public",
    enableNewResourceCreation: true,
    avatar_column: "image_thumbnail",
    create: {
      scope: "",
      required: [],
      optional: [],
      columns: [{ column_name: "name" }],
    },
    columns: defineColumns([
      {
        column_name: "name",
        data_type: "string",
        order: 2,
      },
      {
        column_name: "unit_label",
        data_type: "string",
      },
      {
        column_name: "description",
        data_type: "string",
      },
      {
        column_name: "image_thumbnail",
        data_type: "string",
        hidden: true,
      },
      { column_name: "statement_descriptor", data_type: "string" },
      {
        column_name: "price",
        data_type: "number",
        order: 3,
      },
      {
        column_name: "price_id_primary",
        data_type: "uuid",
      },
      {
        column_name: "mrr",
        data_type: "number",
      },
      {
        column_name: "created_at",
        data_type: "timestamp",
      },
    ]),
  },
  customers: {
    table: "customers",
    deferNewButtonToHeader: true,
    // searchBy: "name,email,contact_name,company_number,status",
    deferSubtitleToHeader: true,
    deferTitleToHeader: true,
    deferToHeader: true,
    drizzleTable: "customers",
    
    idColumn: "customer_id",
    create: {
      scope: "",
      required: [],
      optional: [],
      columns: [
        { column_name: "name" },
        { column_name: "email" },
        {
          column_name: "customer_id",
          hidden: true,
          default_value: "uuid_v4_gen",
        },
        {
          column_name: "organization_id",
          hidden: true,
          default_value: "user.organization",
        },
      ],
    },
    edit: {
      enabled: true,
      deniedColumns: ["customer_id"],
    },
    drilldownRoutePrefix: "/v2/customers",
    force_remove_back_button_store_on_index_resource: true,
    avatar_column: "avatar",
    enableNewResourceCreation: true,
    page_label: "Customers",
    enableSearch: false,
    categories: ["Basic", "Address", "Business", "Tax", "Legal", "Dates"],
    columns: defineColumns([
      {
        column_name: "name",
        category: "Basic",
        minWidth: 200,
        maxWidth: 200,
        order: 1,
      },
      {
        column_name: "email",
        category: "Basic",
        data_type: "string",
        order: 2,
      },
      { column_name: "phone", data_type: "text", category: "Basic" },
      { column_name: "website", data_type: "text", category: "Basic" },
      { column_name: "contact_name", data_type: "text", category: "Basic"},
      {
        column_name: "status",
        data_type: "string",
        field_type: "select",
        order: 3,
        update_column: "status",
        update_table: "customers",
        update_id_column: "customer_id",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
      { column_name: "vat_id", data_type: "text", category: "Business" },
      {
        column_name: "company_number",
        data_type: "text",
        category: "Business",
      },
      {
        column_name: "note",
        data_type: "text",
        category: "Basic",
        field_type: "textarea",
      },
      { column_name: "street_address", data_type: "text", category: "Address" },
      { column_name: "address_line_2", data_type: "text", category: "Address" },
      { column_name: "city", data_type: "text", category: "Address" },
      {
        column_name: "state_province_region",
        data_type: "text",
        category: "Address",
      },
      { column_name: "postal_code", data_type: "text", category: "Address" },
      {
        column_name: "country",
        data_type: "text",
        category: "Address",
        field_type: "select",
        options: Object.entries(countryCodes).map(([label, value]) => ({
          label,
          value,
        })),
      },
      { column_name: "email", data_type: "text" },
      {
        column_name: "size",
        data_type: "text",
        category: "Business",
        field_type: "select",
        options: [
          { label: "1-9", value: "1-9" },
          { label: "10-49", value: "10-49" },
          { label: "50-99", value: "50-99" },
          { label: "100+", value: "100+" },
        ],
      },
      {
        column_name: "customer_type_id",
        data_type: "text",
        category: "Business",
      },
      { column_name: "phone", data_type: "text" },
      { column_name: "website", data_type: "text" },
      { column_name: "legal_form", data_type: "text", category: "Business" },
      { column_name: "owner", data_type: "text", category: "Business" },
      {
        column_name: "vat_return_frequency",
        data_type: "text",
        category: "Tax",
      },
      {
        column_name: "icp_return_frequency",
        data_type: "text",
        category: "Tax",
      },
      { column_name: "cash_management", data_type: "text", category: "Tax" },
      { column_name: "subject_to_vat", data_type: "boolean" },
      { column_name: "created_at", data_type: "timestamp", hidden: true },
      { column_name: "name", data_type: "text" },
      { column_name: "main_contact_id", data_type: "uuid" },
      { column_name: "company_id", data_type: "uuid" },
      { column_name: "domain", data_type: "text" },
      {
        column_name: "administration",
        data_type: "text",
        category: "Business",
      },
      {
        column_name: "contract_start_date",
        data_type: "number",
        category: "Dates",
      },
      {
        column_name: "accounting_start_date",
        data_type: "number",
        category: "Dates",
      },
      { column_name: "closing_enabled", data_type: "boolean", category: "Tax" },
      { column_name: "self_booking", data_type: "boolean", category: "Tax" },
      { column_name: "global_company_id", data_type: "uuid" },
      { column_name: "customer_jurisdiction", data_type: "text" },
      { column_name: "account_manager", data_type: "text" },
      { column_name: "archive_hash", data_type: "text" },
      {
        column_name: "customer_jurisdiction_id",
        data_type: "uuid",
        category: "Business",
        label: "Jurisdictions",
        field_type: "select",
        editor: {
          type: "select",
          data_source: customerJurisdictionDataSource,
        },
        editable: {
          type: "select",
          update_table: "customers",
          update_id_column: "customer_id",
          update_column: "customer_jurisdiction_id",
          data_source: customerJurisdictionDataSource,
        },
      },
      { column_name: "status", data_type: "text" },
      { column_name: "allow_self_accounting", data_type: "boolean" },
      { column_name: "companies", data_type: "number" },
      { column_name: "users", data_type: "number" },
      { column_name: "workflow", data_type: "number" },
      { column_name: "tickets", data_type: "number" },
      { column_name: "questions", data_type: "number" },
      { column_name: "is_overdue", data_type: "boolean" },
      { column_name: "data_provider", data_type: "text" },
      { column_name: "portal", data_type: "text" },
      { column_name: "data_provider_reference_id", data_type: "text" },
      { column_name: "signed_gdpr_document", data_type: "boolean" },
      { column_name: "archived_at", data_type: "number" },
      { column_name: "inactive_on", data_type: "number" },
      { column_name: "last_seen_at", data_type: "number" },
      { column_name: "bundle", data_type: "text" },
      { column_name: "accountant_id", data_type: "text" },
      { column_name: "accountant_name", data_type: "text" },
      { column_name: "accountant_is_partner_backoffice", data_type: "boolean" },
      { column_name: "currencies", data_type: "json" },
      { column_name: "default_currency", data_type: "text" },
      { column_name: "domain_wildcard_email", data_type: "text" },
      { column_name: "internal_email_support", data_type: "text" },
      { column_name: "internal_phone_number", data_type: "text" },
      { column_name: "internal_email_administration", data_type: "text" },
      { column_name: "supported_languages", data_type: "json" },
      { column_name: "is_partner_domain", data_type: "text" },
      { column_name: "subject_to_reverse_vat_charge", data_type: "boolean" },
      { column_name: "avatar", data_type: "text", hidden: true },
      { column_name: "metadata", data_type: "json" },
      { column_name: "company_country_number", data_type: "text" },
      { column_name: "payment_method_invoice", data_type: "text" },
      { column_name: "person_number_ref", data_type: "text" },
      { column_name: "person_number", data_type: "text" },
      { column_name: "birth_day", data_type: "text" },
      { column_name: "salutations", data_type: "text" },
      { column_name: "payment_term_invoice", data_type: "text" },
      { column_name: "label", data_type: "text" },
      { column_name: "language_invoice_and_quote", data_type: "text" },
      { column_name: "last_name", data_type: "text" },
      { column_name: "street", data_type: "text" },
      { column_name: "first_name", data_type: "text" },
      { column_name: "description", data_type: "text" },
      { column_name: "reverse_charged", data_type: "boolean" },
      { column_name: "awaiting_deletion", data_type: "boolean" },
      {
        column_name: "data_residency",
        data_type: "text",
        field_type: "select",
        options: [
          {
            label: "EU-DE",
            value: "EU-DE",
          },
          {
            label: "EU-FI",
            value: "EU-FI",
          },
          {
            label: "EU-NL",
            value: "EU-NL",
          },
          {
            label: "CA",
            value: "CA",
          },
          {
            label: "US-NY",
            value: "CA",
          },
        ],
      },
      { column_name: "custom_tags", data_type: "json" },
      { column_name: "dpa_signed", data_type: "boolean" },
      { column_name: "dpa_signed_url", data_type: "text" },
      { column_name: "dpa_signed_at", data_type: "number" },
      { column_name: "consent_marketing_communications", data_type: "boolean" },
      { column_name: "consent_marketing_data_provider", data_type: "text" },
      {
        column_name: "nsent_marketing_communications_given_at",
        data_type: "number",
      },
      {
        column_name: "consent_marketing_communications_preferences",
        data_type: "text",
      },
      { column_name: "lead_source", data_type: "text" },
      { column_name: "group_structure", data_type: "json" },
      { column_name: "onboarding_approved", data_type: "boolean" },
      { column_name: "onboarded_by_user", data_type: "text" },
      { column_name: "onboarding_aproval_conditions", data_type: "text" },
      { column_name: "onboarding_aproval_findings", data_type: "text" },
      { column_name: "is_oss", s: "boolean" },
      { column_name: "is_ioss", data_type: "boolean" },
      { column_name: "is_article23", data_type: "boolean" },
      {
        column_name: "kyc_status",
        data_type: "text",
        field_type: "select",
        update_column: "kyc_status",
        update_table: "customers",
        update_id_column: "customer_id",
        options: [
          { label: "Complete", value: "complete" },
          { label: "Incomplete", value: "incomplete" },
          { label: "Awaiting review", value: "awaiting_review" },
          { label: "Rejected", value: "rejected" },
        ],
      },
      { column_name: "payroll_withholding_number", data_type: "text" },
      { column_name: "risk_rating", data_type: "text" },
      { column_name: "pep_sanction_checked_at", data_type: "number" },
      { column_name: "is_pep_sanction", data_type: "boolean" },
      { column_name: "credit_limit", data_type: "number" },
      { column_name: "credit_debit_notes", data_type: "text" },
      { column_name: "credit_debit_arrangements", data_type: "text" },
      { column_name: "credit_hold_flags", data_type: "text" },
      { column_name: "customer_success_manager", data_type: "text" },
      { column_name: "store_user_ids", data_type: "text" },
      { column_name: "adverse_media_check_flags", data_type: "text" },
      { column_name: "adverse_media_checked_at", data_type: "number" },
      { column_name: "adverse_media_data_provider", data_type: "text" },
      { column_name: "invoicing_entity_legal_name", data_type: "text" },
      {
        column_name: "has_ultimate_beneficial_owner_statement",
        data_type: "boolean",
      },
      { column_name: "has_identity_card", data_type: "boolean" },
      { column_name: "has_business_registry_extract", data_type: "boolean" },
      { column_name: "has_power_of_attorney", data_type: "boolean" },
      { column_name: "has_source_of_wealth", data_type: "boolean" },
      { column_name: "has_source_of_funds", data_type: "boolean" },
      { column_name: "has_store_status", data_type: "boolean" },
      {
        column_name: "timezone",
        data_type: "text",
        category: "Basic",
        field_type: "select",
        options: timezoneKeys.map((key) => ({ label: key, value: key })),
      },
      { column_name: "language", data_type: "text", category: "Basic" },
      {
        column_name: "sla_agreed_response",
        data_type: "text",
        category: "Business",
      },
      {
        column_name: "sla_reporting_format_cadence",
        data_type: "text",
        category: "Business",
      },
      {
        column_name: "primary_ledger",
        data_type: "text",
        category: "Business",
      },
      {
        column_name: "primary_ledger_tenant_id",
        data_type: "text",
        category: "Business",
      },
      {
        column_name: "signed_contract",
        data_type: "text",
        category: "Legal",
      },
      {
        column_name: "rating_amount_questions",
        data_type: "string",
        category: "Client success",
        label: "Rating questions amount",
        field_type: "select",
        options: [
          {
            label: "Low",
            value: "low",
          },
          {
            label: "Normal",
            value: "normal",
          },
          {
            label: "High",
            value: "high",
          },
        ],
      },
      {
        column_name: "rating_difficult_admin",
        data_type: "string",
        category: "Client success",
        label: "Rating difficulty admin",
        field_type: "select",
        options: [
          {
            label: "Low",
            value: "low",
          },
          {
            label: "Normal",
            value: "normal",
          },
          {
            label: "High",
            value: "high",
          },
        ],
      },
      {
        column_name: "rating_responds_timely",
        data_type: "string",
        category: "Client success",
        label: "Rating respond time",
        field_type: "select",
        options: [
          {
            label: "Low",
            value: "low",
          },
          {
            label: "Normal",
            value: "normal",
          },
          {
            label: "High",
            value: "high",
          },
        ],
      },
      {
        column_name: "rating_payments",
        data_type: "string",
        category: "Client success",
        label: "Rating payments",
        field_type: "select",
        options: [
          {
            label: "Low",
            value: "low",
          },
          {
            label: "Normal",
            value: "normal",
          },
          {
            label: "High",
            value: "high",
          },
        ],
      },
    ] as ResourceFieldSpec[]),
  },
  transactions: {
    idColumn: "transaction_id",
    table: "stargate_ponto_transactions",
    companyIdColumn: "organization_id",
    searchBy: "transaction_id,description",
    force_remove_back_button_store_on_index_resource: true,
    columns: [
      {
        column_name: "transaction_id",
      },
      {
        column_name: "time",
      },
      {
        column_name: "ponto_account_id",
      },
      {
        column_name: "description",
      },
      {
        column_name: "amount",
      },
      {
        column_name: "currency",
      },
      {
        column_name: "counterpart_name",
        label: "Name counterpart",
      },
      {
        column_name: "counterpart_reference",
        label: "Reference counterpart",
      },
      {
        column_name: "remittance_information",
        label: "Remittance information",
      },
      {
        column_name: "promoted_to_transaction",
        label: "Promoted to transaction",
      },
    ],
  },
  invoices: defineDrizzleResourceRoute({
    table: "invoices",
    idColumn: "invoice_id",
    companyIdColumn: "organization_id",
    enableSearch: true,
    searchBy: "invoice_nr,recipient_company,status, ",
    deferNewButtonToHeader: true,
    deferTitleToHeader: true,
    deferSubtitleToHeader: true,
    deferToHeader: true,

    force_external_api_updates: true,
    enableNewResourceCreation: true,
    create: {
      scope: "",

      required: [],
      optional: [],
      columns: [
        { column_name: "recipient_email" },
        {
          column_name: "customer_id",
          header: "Customer",
          nullable: true,
          editor: {
            type: "select",
            data_source: customersDataSource,
          },
        },
        {
          column_name: "organization_id",
          hidden: true,
          default_value: "user.organization_id",
        },
        {
          column_name: "status",
          hidden: true,
          default_value: "pending",
        },
        {
          column_name: "ref_provider",
          hidden: true,
          default_value: "suitsbooks",
        },
      ],
    },
    force_no_cache: false,
    force_remove_back_button_store_on_index_resource: true,
    drilldownRoutePrefix: "/invoices",
    edit: {
      enabled: true,
      allowedColumns: [
        "recipient_name",
        "recipient_email",
        "invoice_nr",
        "recipient_postal_code",
        "recipient_phone",
        "recipient_first_name",
        "recipient_last_name",
        "recipient_address",
        "recipient_country",
        "due_date",
        "currency",
        "contact",
        "status",
        "recipient_company",
        "recipient_company_id",
        "paid",
        "author_name",
        "link_tos",
        "link_privacy_policy",
        "memo",
        "author_email",
        "author_postal_code",
        "author_phone",
        "author_first_name",
        "author_last_name",
        "author_address",
        "author_country",
        "author_company_id",
        "author_vat_id",
        "author_tax_id",
        "author_kvk",
        "recipient_kvk",
        "recipient_tax_id",
        "recipient_vat_id",
        "amount",
        "amount_paid",
        "amount_remaining",
        "paid_at",
        "payment_method",
        "number_format",
        "email_sent",
        "email_id",
        "email_sent_at",
        "times_opened",
        "times_opened_unique",
        "company_logo",
        "company_logo_href",
        "discount_code",
        "discount_total",
        "discount",
        "shipping_rate",
        "shipping_total",
        "send_as_email",
        "subscription",
        "subscription_id",
        "relation_hash",
        "scheduled_email_send_at",
        "descriptor_global",
        "descriptor_relation",
        "number_global",
        "number_relation",
        "url",
        "brand_color",
        "pdf_generated",
        "pdf_url",
        "reverse_charged",
        "invoice_template_id",
        "custom_fields",
        "tax_id_type_recipient",
        "tax_id_type_author",
        "descriptor_project",
        "views",
        "revenue",
        "sales",
        "note",
        "url_link_deactivated",
        "total_fmt",
        "subtotal_fmt",
        "tax_total_fmt",
        "has_payment_callback",
        "payment_method_count",
        "invoice_age_days_past_due",
        "payment_methods",
        "creator_ip_address",
        "author_tax_country",
        "recipient_tax_country",
        "issue_date",
        "payment_method_ids",
        "footer",
        "slug",
        "subtotal",
        "tax_amount",
        "total",
        "idempotency_key",
        "payment_method_configuration_id",
        "language",
        "amount_paid_fmt",
        "amount_remaining_fmt",
        "tax_rate",
        "time_creation",
        "recipient_billing_street",
        "recipient_shipping_street",
        "recipient_billing_house_number",
        "recipient_shipping_house_number",
        "recipient_billing_country",
        "recipient_shipping_country",
        "recipient_shipping_province",
        "recipient_shipping_city",
        "tax_exempt",
        "tax_inclusive",
        "receipt_url",
        "awaiting_archival",
        "reconciliation_id",
        "quote_id",
        "customer_id",
        "global_company_id",
        "amount_due_fmt",
        "ref_identifier",
        "ref_provider",
        "total_incl_vat",
        "document_type",
        "cancelled_at",
      ],
    },
    drizzleTable: "invoices",

    columns: [
      {
        column_name: "created_at",
        maxWidth: 100,
      },
      {
        column_name: "total",
        maxWidth: 100,
      },
      {
        column_name: "status",
        maxWidth: 100,
        order: 1,
        editable: {
          type: "select",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Pending", value: "pending" },
            { label: "Paid", value: "paid" },
            { label: "Overdue", value: "overdue" },
            { label: "Cancelled", value: "cancelled" },
          ],
          update_table: "invoices",
          update_column: "status",
          update_id_column: "invoice_id",
        },
      },
      {
        column_name: "invoice_nr",
        header_label: "Invoice number",
        widthFit: true,
        formatter: (value: unknown) =>
          typeof value === "string" ? value.toUpperCase() : value,
      },
      {
        column_name: "customer_id",
        href: "/v2/customers/{{customer_id}}",
        cell_value_mask_label: "{{recipient_company}}",
        header_label: "Customer",
        maxWidth: 100,
      },
      {
        column_name: "currency",
        hidden: true,
      },
      {
        column_name: "due_date",
      },

      {
        column_name: "invoice_id",
        cell_value_mask_label: "{{invoice_nr}}",
        order: 3,
      },
      {
        column_name: "issue_date",
      },
      {
        column_name: "recipient_company",
        hidden: true,
      },
      {
        column_name: "paid",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
      },
      {
        column_name: "tax_exempt",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
        hidden: true,
      },
      {
        column_name: "awaiting_archival",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
        hidden: true,
      },
      {
        column_name: "tax_inclusive",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
        hidden: true,
      },
      {
        column_name: "reverse_charged",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
        hidden: true,
      },
      {
        column_name: "pdf_generated",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
        hidden: true,
      },
      {
        column_name: "has_payment_callback",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
        hidden: true,
      },
      {
        column_name: "subscription",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
        hidden: true,
      },
      {
        column_name: "send_as_email",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
        hidden: true,
      },
      {
        column_name: "shipping_rate",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
        hidden: true,
      },
      {
        column_name: "email_sent",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
        hidden: true,
      },
      {
        column_name: "url_link_deactivated",
        data_type: "boolean",
        editable: {
          type: "boolean",
        },
        hidden: true,
      },
      {
        column_name: "time_creation",
        data_type: "date",
        editable: {
          type: "text",
        },
        hidden: true,
      },
      {
        column_name: "slug",
        data_type: "string",
        editable: {
          type: "text",
        },
        hidden: true,
      },
    ],
  }),

  cases: {
    table: "v_cases",
    idColumn: "ticket_id",
    page_label: "Cases",
    sidebar_route: "/sf-formations",
    companyIdColumn: "company_id",
    enableSearch: true,
    searchBy: "title,status,ticket_id,description,ticket_number",
    drilldownRoutePrefix: "/cases",
    chat: {
      table: "customer_messages",
      foreignKeyColumn: "message_id",
      messageColumn: "message",
      authorUserIdColumn: "author_user_id",
    },
    columns: [
      { column_name: "status", order: 1, maxWidth: 80 },
      { column_name: "priority", order: 2, maxWidth: 80 },
      { column_name: "title", order: 3, maxWidth: 180 },
      { column_name: "assignees", maxWidth: 80, order: 4 },
      { column_name: "created_at" },
      { column_name: "close_reason" },
      { column_name: "scope" },
      { column_name: "bucket" },
      { column_name: "company_id", hidden: true },
    ],
  },
};

const formatWarning = (
  routeName: string,
  columnName: string,
  issue: string,
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
    const meta = getDrizzleColumnMeta(table, columnName);
    if (!meta) {
      formatWarning(routeName, columnName, "does not exist in schema");
      return;
    }
    const columnInfo = getDrizzleColumnInfo(table, columnName);
    const schemaFieldDataType = columnInfo.dataType;
    const actualTypeLabel = meta.type ?? schemaFieldDataType;
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
        `declares data_type "${expectedType}" but schema reports "${meta.type}"`,
      );
    }
  });
};

Object.entries(RESOURCE_ROUTES).forEach(([name, route]) => {
  const tableName = Array.isArray(route.table)
    ? route.table[0]
    : route.table || route.drizzleTable;
  validateResourceColumns(name, tableName, route.columns);
});
