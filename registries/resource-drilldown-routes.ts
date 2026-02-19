import { createElement } from "react";
import { User } from "lucide-react";
import type { ResourceDrilldownRoute } from "../resource-types";
import { interpolateDrilldownTemplate } from "@/packages/resource-framework/utils/drilldown-template";

/**
 * Generates a drilldown URL path by replacing template placeholders with actual values.
 * Supports nested property access using dot notation (e.g., "user.name").
 *
 * @param name - The resource name to look up in RESOURCE_DRILLDOWN_ROUTES
 * @param payload - Object containing values to substitute into the path template
 * @returns The generated path string with placeholders replaced, or null if resource not found
 *
 * @example
 * ```tsx
 * const path = getDrilldownPath('customers', { uuid: '123', name: 'John' });
 * // path = '/v2/customers/123'
 * ```
 */
export function getDrilldownPath(
  name: string,
  payload: Record<string, unknown>,
): string | null {
  const key = String(name || "").toLowerCase();
  const entry = RESOURCE_DRILLDOWN_ROUTES[key];
  if (!entry) return null;
  const template = entry.pathTemplate || "";
  return interpolateDrilldownTemplate(template, payload);
}

import { S3_CLIENT_CONFIG } from "@/lib/config";

export const RESOURCE_DRILLDOWN_ROUTES: Record<string, ResourceDrilldownRoute> =
  {
    transactions: {
      backLabel: "Back to transactions",
    },
    invoices: {
      autoHideEmptyColumns: false,
      title: (row) => `Invoice ${row?.invoice_nr ?? ""}`,

      sections: [
        {
          title: "General information",
          columns: 2,
          fields: [
            {
              key: "status",
              label: "Status",
              field_type: "select",
              options: [
                { label: "Draft", value: "draft" },
                { label: "Pending", value: "pending" },
                { label: "Paid", value: "paid" },
                { label: "Overdue", value: "overdue" },
                { label: "Cancelled", value: "cancelled" },
              ],
            },
            { key: "invoice_nr", label: "Invoice number" },
            { key: "slug", label: "Slug" },
            { key: "document_type", label: "Document type" },
            { key: "language", label: "Language" },
            { key: "currency", label: "Currency" },
            { key: "number_format", label: "Number format" },
            { key: "paid", label: "Paid", field_type: "boolean" },
            { key: "tax_exempt", label: "Tax exempt", field_type: "boolean" },
            {
              key: "tax_inclusive",
              label: "Tax inclusive",
              field_type: "boolean",
            },
            {
              key: "reverse_charged",
              label: "Reverse charged",
              field_type: "boolean",
            },
            { key: "subscription", label: "Subscription" },
            { key: "subscription_id", label: "Subscription ID" },
          ],
        },
        {
          title: "Amounts",
          columns: 2,
          fields: [
            { key: "amount", label: "Amount", field_type: "number" },
            { key: "subtotal", label: "Subtotal", field_type: "number" },
            { key: "tax_amount", label: "Tax amount", field_type: "number" },
            { key: "tax_rate", label: "Tax rate", field_type: "number" },
            { key: "total", label: "Total", field_type: "number" },
            {
              key: "total_incl_vat",
              label: "Total incl. VAT",
              field_type: "number",
            },
            { key: "amount_paid", label: "Amount paid", field_type: "number" },
            {
              key: "amount_remaining",
              label: "Amount remaining",
              field_type: "number",
            },
            { key: "discount", label: "Discount" },
            { key: "discount_code", label: "Discount code" },
            {
              key: "discount_total",
              label: "Discount total",
              field_type: "number",
            },
            {
              key: "shipping_rate",
              label: "Shipping rate",
              field_type: "number",
            },
            {
              key: "shipping_total",
              label: "Shipping total",
              field_type: "number",
            },
            { key: "revenue", label: "Revenue", field_type: "number" },
            { key: "sales", label: "Sales", field_type: "number" },
          ],
        },
        {
          title: "Formatted amounts",
          columns: 2,
          fields: [
            { key: "total_fmt", label: "Total formatted" },
            { key: "subtotal_fmt", label: "Subtotal formatted" },
            { key: "tax_total_fmt", label: "Tax total formatted" },
            { key: "amount_paid_fmt", label: "Amount paid formatted" },
            {
              key: "amount_remaining_fmt",
              label: "Amount remaining formatted",
            },
            { key: "amount_due_fmt", label: "Amount due formatted" },
          ],
        },
        {
          title: "Recipient information",
          columns: 2,
          fields: [
            { key: "recipient_name", label: "Name" },
            { key: "recipient_company", label: "Company" },
            { key: "recipient_company_id", label: "Company ID" },
            { key: "recipient_email", label: "Email" },
            { key: "recipient_phone", label: "Phone" },
            { key: "recipient_first_name", label: "First name" },
            { key: "recipient_last_name", label: "Last name" },
            { key: "recipient_address", label: "Address" },
            { key: "recipient_postal_code", label: "Postal code" },
            { key: "recipient_country", label: "Country" },
            { key: "recipient_vat_id", label: "VAT ID" },
            { key: "recipient_tax_id", label: "Tax ID" },
            { key: "recipient_kvk", label: "KVK" },
            { key: "recipient_tax_country", label: "Tax country" },
            { key: "tax_id_type_recipient", label: "Tax ID type" },
          ],
        },
        {
          title: "Recipient billing address",
          columns: 2,
          fields: [
            { key: "recipient_billing_street", label: "Street" },
            { key: "recipient_billing_house_number", label: "House number" },
            { key: "recipient_billing_country", label: "Country" },
          ],
        },
        {
          title: "Recipient shipping address",
          columns: 2,
          fields: [
            { key: "recipient_shipping_street", label: "Street" },
            { key: "recipient_shipping_house_number", label: "House number" },
            { key: "recipient_shipping_city", label: "City" },
            { key: "recipient_shipping_province", label: "Province" },
            { key: "recipient_shipping_country", label: "Country" },
          ],
        },
        {
          title: "Author information",
          columns: 2,
          fields: [
            { key: "author_name", label: "Name" },
            { key: "author_email", label: "Email" },
            { key: "author_phone", label: "Phone" },
            { key: "author_first_name", label: "First name" },
            { key: "author_last_name", label: "Last name" },
            { key: "author_address", label: "Address" },
            { key: "author_postal_code", label: "Postal code" },
            { key: "author_country", label: "Country" },
            { key: "author_company_id", label: "Company ID" },
            { key: "author_vat_id", label: "VAT ID" },
            { key: "author_tax_id", label: "Tax ID" },
            { key: "author_kvk", label: "KVK" },
            { key: "author_tax_country", label: "Tax country" },
            { key: "tax_id_type_author", label: "Tax ID type" },
          ],
        },
        {
          title: "Dates",
          columns: 2,
          fields: [
            { key: "created_at", label: "Created at" },
            { key: "issue_date", label: "Issue date", field_type: "date" },
            { key: "due_date", label: "Due date", field_type: "date" },
            { key: "paid_at", label: "Paid at", field_type: "date" },
            { key: "cancelled_at", label: "Cancelled at", field_type: "date" },
            { key: "time_creation", label: "Time creation" },
            {
              key: "invoice_age_days_past_due",
              label: "Days past due",
              field_type: "number",
            },
          ],
        },
        {
          title: "Payment",
          columns: 2,
          fields: [
            { key: "payment_method", label: "Payment method" },
            { key: "payment_method_ids", label: "Payment method IDs" },
            { key: "payment_method_count", label: "Payment method count" },
            { key: "payment_methods", label: "Payment methods" },
            {
              key: "payment_method_configuration_id",
              label: "Payment method configuration ID",
            },
            {
              key: "has_payment_callback",
              label: "Has payment callback",
              field_type: "boolean",
            },
          ],
        },
        {
          title: "Email & notifications",
          columns: 2,
          fields: [
            { key: "email_sent", label: "Email sent", field_type: "boolean" },
            { key: "email_id", label: "Email ID" },
            { key: "email_sent_at", label: "Email sent at" },
            { key: "send_as_email", label: "Send as email" },
            {
              key: "scheduled_email_send_at",
              label: "Scheduled email send at",
            },
          ],
        },
        {
          title: "Tracking",
          columns: 2,
          fields: [
            { key: "times_opened", label: "Times opened" },
            { key: "times_opened_unique", label: "Times opened unique" },
            { key: "views", label: "Views" },
          ],
        },
        {
          title: "Links & URLs",
          columns: 2,
          fields: [
            { key: "url", label: "URL" },
            { key: "url_link_deactivated", label: "URL link deactivated" },
            { key: "receipt_url", label: "Receipt URL" },
            { key: "pdf_url", label: "PDF URL" },
            { key: "link_tos", label: "Link TOS" },
            { key: "link_privacy_policy", label: "Link privacy policy" },
          ],
        },
        {
          title: "Branding",
          columns: 2,
          fields: [
            { key: "company_logo", label: "Company logo" },
            { key: "company_logo_href", label: "Company logo href" },
            { key: "brand_color", label: "Brand color" },
            { key: "invoice_template_id", label: "Invoice template ID" },
          ],
        },
        {
          title: "Content",
          columns: 2,
          fields: [
            { key: "memo", label: "Memo", field_type: "textarea" },
            { key: "note", label: "Note", field_type: "textarea" },
            { key: "footer", label: "Footer" },
            { key: "custom_fields", label: "Custom fields" },
          ],
        },
        {
          title: "Descriptors",
          columns: 2,
          fields: [
            { key: "descriptor_global", label: "Descriptor global" },
            { key: "descriptor_relation", label: "Descriptor relation" },
            { key: "descriptor_project", label: "Descriptor project" },
            { key: "number_global", label: "Number global" },
            { key: "number_relation", label: "Number relation" },
          ],
        },
        {
          title: "References",
          columns: 2,
          fields: [
            { key: "contact", label: "Contact" },
            { key: "customer", label: "Customer" },
            { key: "global_company_id", label: "Global company ID" },
            { key: "organization_id", label: "Organization ID" },
            { key: "relation_hash", label: "Relation hash" },
            { key: "reconciliation_id", label: "Reconciliation ID" },
            { key: "quote_id", label: "Quote ID" },
            { key: "ref_identifier", label: "Reference identifier" },
            { key: "ref_provider", label: "Reference provider" },
          ],
        },
        {
          title: "Other",
          columns: 2,
          fields: [
            {
              key: "pdf_generated",
              label: "PDF generated",
              field_type: "boolean",
            },
            {
              key: "awaiting_archival",
              label: "Awaiting archival",
              field_type: "boolean",
            },
            { key: "creator_ip_address", label: "Creator IP address" },
            { key: "idempotency_key", label: "Idempotency key" },
          ],
        },
      ],
    },
    customers: {
      title: (row) => String(row?.name || `Customer ${row?.customer_id || ""}`),
      deferTitleToHeader: true,
      deferTitleIconToHeader: true,
      titleIcon: () => createElement(User, { className: "text-icon h-4 w-4 px-0" }),
      autoHideEmptyColumns: true,
      paddingBottom: 45,
      sections: [
        {
          title: "General information",
          columns: 2,
          fields: [
            {
              key: "status",
              label: "Status",
              field_type: "select",
              options: [
                {
                  label: "Active",
                  value: "active",
                },
                {
                  label: "Inactive",
                  value: "inactive",
                },
              ],
            },
            { key: "name", label: "Name" },
            { key: "language", label: "Language" },
            { key: "company_number", label: "Company number" },
            { key: "vat_id", label: "VAT ID" },
            { key: "customer_type_id", label: "Customer type" },
            {
              key: "customer_jurisdiction_id",
              field_type: "select",
              label: "Jurisdiction",
            },
            { key: "account_manager", label: "Account manager" },
            { key: "owner", label: "Owner" },
            { key: "legal_form", label: "Legal form" },
            {
              key: "size",
              label: "Size",
              field_type: "select",
              options: [
                { label: "1-10", value: "1-10" },
                {
                  label: "11-49",
                  value: "11-49",
                },
                { label: "50-99", value: "50-99" },
                { label: "100+", value: "100+" },
              ],
            },
            { key: "label", label: "Label" },
            { key: "note", label: "Note" },
          ],
        },
        {
          title: "Contact",
          columns: 2,
          fields: [
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "website", label: "Website" },
            { key: "contact_name", label: "Contact name" },
          ],
        },
        {
          title: "Address",
          columns: 2,
          fields: [
            { key: "street_address", label: "Street address" },
            { key: "address_line_2", label: "Address line 2" },
            { key: "city", label: "City" },
            { key: "state_province_region", label: "State/Province/Region" },
            { key: "postal_code", label: "Postal code" },
            { key: "country", label: "Country" },
          ],
        },
        {
          title: "Administration",
          columns: 2,
          fields: [
            { key: "administration", label: "Administration" },
            { key: "timezone", label: "Timezone" },
            { key: "primary_ledger", label: "Primary ledger" },
            {
              key: "primary_ledger_tenant_id",
              label: "Primary ledger tenant id",
            },
            { key: "sla_agreed_response", label: "SLA agreed response" },
            {
              key: "sla_reporting_format_cadence",
              label: "SLA reporting cadence",
            },
            { key: "accounting_start_date", label: "Accounting start date" },
            { key: "contract_start_date", label: "Contract start date" },
            { key: "allow_self_accounting", label: "Allow self accounting" },
            { key: "self_booking", label: "Self booking" },
            { key: "closing_enabled", label: "Closing enabled" },
            { key: "subject_to_vat", label: "Subject to VAT" },
            {
              key: "subject_to_reverse_vat_charge",
              label: "Subject to reverse VAT charge",
            },
            { key: "bundle", label: "Bundle" },
          ],
        },
        {
          title: "Compliance",
          columns: 2,
          fields: [
            {
              key: "kyc_status",
              label: "KYC status",
              field_type: "select",
              options: [
                { label: "Complete", value: "complete" },
                { label: "Incomplete", value: "incomplete" },
                { label: "Awaiting review", value: "awaiting_review" },
                { label: "Rejected", value: "rejected" },
              ],
            },
            { key: "risk_rating", label: "Risk rating" },
            { key: "signed_gdpr_document", label: "Signed GDPR document" },
            { key: "dpa_signed", label: "DPA signed" },
            { key: "dpa_signed_url", label: "DPA signed URL" },
            { key: "dpa_signed_at", label: "DPA signed at", hidden: true },
            {
              key: "pep_sanction_checked_at",
              label: "PEP sanction checked at",
              hidden: true,
            },
            { key: "is_pep_sanction", label: "Is PEP/Sanction" },
            {
              key: "adverse_media_check_flags",
              label: "Adverse media check flags",
            },
            {
              key: "adverse_media_checked_at",
              label: "Adverse media checked at",
              hidden: true,
            },
            {
              key: "adverse_media_data_provider",
              label: "Adverse media data provider",
            },
          ],
        },
        {
          title: "Client success",
          columns: 2,
          fields: [
            {
              key: "rating_amount_questions",
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
              key: "rating_difficult_admin",
              label: "Rating difficult admin",
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
              key: "rating_payments",
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
            {
              key: "rating_responds_timely",
              label: "Rating responds timely",
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
          ],
        },
        {
          title: "Other",
          columns: 2,
          fields: [
            { key: "created_at", label: "Created at", hidden: true },
            { key: "archived_at", label: "Archived at", hidden: true },
            { key: "inactive_on", label: "Inactive on", hidden: true },
            { key: "last_seen_at", label: "Last seen at", hidden: true },
            { key: "data_provider", label: "Data provider" },
            { key: "data_residency", label: "Data residency" },
            { key: "group_structure", label: "Group structure" },
            { key: "metadata", label: "Metadata" },
            { key: "custom_tags", label: "Custom tags" },
            { key: "avatar", label: "Avatar" },
          ],
        },
        {
          title: "Invoices",
          columns: 1,
          fields: [],
          expose_to_edit_state: false,
          widgets: [
            {
              type: "table",
              id: "customer-invoices",
              props: {
                resourceName: "invoices",
                conditions: [
                  {
                    eq_column: "customer_id",
                    eq_value: "{{customer_id}}",
                  },
                ],
                title: "Invoices",
                titleSize: "small",
                enableSearch: true,
                enablePagination: true,
                enableDownload: false,
                limit: 10,
                enableAddButton: true,
                create: {
                  columns: [
                    {
                      column_name: "recipient_email",
                    },
                    {
                      column_name: "customer_id",
                      hidden: true,
                    },
                    {
                      column_name: "organization_id",
                      hidden: true,
                      default_value: "user.organization_id",
                    },
                  ],
                  required: ["recipient_email"],
                },
              },
            },
          ],
        },
        {
          title: "Files",
          columns: 1,
          expose_to_edit_state: false,
          fields: [],
          widgets: [
            {
              type: "file_explorer",
              props: {
                s3_client: S3_CLIENT_CONFIG,
                fileIdColumn: "file_id",
                table: "files",
                organizationIdColumn: "organization_id",
                columns: [
                  "file_id",
                  "file_name",
                  "name",
                  "s3_bucket",
                  "url",
                  "size",
                  "mime_type",
                  "created_at",
                ],
                conditions: [
                  {
                    eq_column: "customer_id",
                    eq_value: "{{resource_id}}",
                  },
                  {
                    eq_column: "organization_id",
                    eq_value: "{{user.organization_id}}",
                  },
                ],
                resourceIdColumn: "customer_id",
                resourceName: "customers",
                bucket: "suitsconnect",
                maxFileSizeMB: 50,
                limit: 25,
              },
            },
          ],
        },
      ],
    },
    files: {
      title: (row) => `${row?.filename}` || `File ${row?.file_id}`,
    },
  };
