import { defineColumns } from "../constructors/define-columns";
import type { ResourceRoute } from "../resource-types";

export const coreResourceRoutes: Record<string, ResourceRoute> = {
  demo_contacts: {
    table: "demo_contacts",
    schema: "public",
    athenaModel: "demoContacts",
    idColumn: "demo_contact_id",
    companyIdColumn: "organization_id",
    page_label: "Contacts",
    enableSearch: true,
    searchBy: "first_name,last_name,email_address,contact_number",
    enableNewResourceCreation: true,
    newResourceButtonText: "Add contact",
    create: {
      scope: "demo",
      required: ["first_name", "last_name", "email_address"],
      optional: [
        "contact_number",
        "home_country",
        "preferred_channel",
        "notes",
      ],
      defaultValues: {
        company_id: "demo-company",
        organization_id: "demo-organization",
      },
      columns: defineColumns([
        { column_name: "first_name", header: "First name", data_type: "string" },
        { column_name: "last_name", header: "Last name", data_type: "string" },
        { column_name: "email_address", header: "Email address", data_type: "string" },
        { column_name: "contact_number", header: "Contact number", data_type: "string" },
        {
          column_name: "home_country",
          header: "Home country",
          data_type: "string",
          editor: {
            type: "select",
            options: [
              { label: "Canada", value: "CA" },
              { label: "Germany", value: "DE" },
              { label: "South Korea", value: "KR" },
              { label: "United Kingdom", value: "GB" },
              { label: "United States", value: "US" },
            ],
          },
        },
        {
          column_name: "preferred_channel",
          header: "Preferred channel",
          data_type: "string",
          editor: {
            type: "select",
            options: [
              { label: "Email", value: "email" },
              { label: "Phone and email", value: "phone_email" },
              { label: "SMS", value: "sms" },
            ],
          },
        },
        {
          column_name: "notes",
          header: "Notes",
          data_type: "string",
          editor: { type: "textarea" },
        },
      ]),
    },
    drilldownRoutePrefix: "/demo/contacts",
    drilldown: {
      autoHideEmptyColumns: true,
    },
    columns: defineColumns([
      { column_name: "demo_contact_id", data_type: "string", hidden: true },
      { column_name: "first_name", data_type: "string", order: 1 },
      { column_name: "last_name", data_type: "string", order: 2 },
      { column_name: "email_address", data_type: "string", order: 3 },
      { column_name: "contact_number", data_type: "string", order: 4 },
      { column_name: "home_country", data_type: "string", order: 5 },
      { column_name: "preferred_channel", data_type: "string", order: 6 },
      { column_name: "notes", data_type: "string", order: 7 },
      { column_name: "company_id", data_type: "string", hidden: true },
      { column_name: "organization_id", data_type: "string", hidden: true },
      { column_name: "created_at", data_type: "timestamp", order: 8 },
      { column_name: "updated_at", data_type: "timestamp", order: 9 },
    ]),
  },
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
    athenaModel: "customerJurisdictions",
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
    athenaModel: "glAccounts",
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
    athenaModel: "products",
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
};

