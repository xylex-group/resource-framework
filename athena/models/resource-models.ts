import {
  boolean,
  number,
  string,
  table,
  type RowOf,
} from "@xylex-group/athena/browser";

const demoContactsModel = table("demoContacts")
  .from("demo_contacts")
  .schema("public")
  .columns({
    demo_contact_id: string().generated(),
    first_name: string().optional(),
    last_name: string().optional(),
    email_address: string().optional(),
    contact_number: string().optional(),
    home_country: string().optional(),
    preferred_channel: string().optional(),
    notes: string().optional(),
    company_id: string().optional(),
    organization_id: string().optional(),
    created_at: string().optional(),
    updated_at: string().optional(),
  })
  .primaryKey("demo_contact_id");

const customerJurisdictionsModel = table("customerJurisdictions")
  .schema("public")
  .columns({
    id: string().generated(),
    name: string().optional(),
  })
  .primaryKey("id");

const glAccountsModel = table("glAccounts")
  .schema("public")
  .columns({
    id: string().generated(),
    description: string().optional(),
  })
  .primaryKey("id");

const productsModel = table("products")
  .schema("public")
  .columns({
    id: string().generated(),
    name: string().optional(),
  })
  .primaryKey("id");

const customersModel = table("customers")
  .schema("public")
  .columns({
    id: string().generated(),
    company_name: string().optional(),
  })
  .primaryKey("id");

const invoicesModel = table("invoices")
  .schema("public")
  .columns({
    invoice_id: string().generated(),
    organization_id: string(),
    created_at: string().optional(),
    total: number().optional(),
    status: string().optional(),
    invoice_nr: string().optional(),
    customer_id: string().optional(),
    currency: string().optional(),
    due_date: string().optional(),
    issue_date: string().optional(),
    recipient_company: string().optional(),
    paid: boolean().optional(),
    tax_exempt: boolean().optional(),
    awaiting_archival: boolean().optional(),
    tax_inclusive: boolean().optional(),
    reverse_charged: boolean().optional(),
    pdf_generated: boolean().optional(),
    has_payment_callback: boolean().optional(),
    subscription: boolean().optional(),
    send_as_email: boolean().optional(),
    shipping_rate: boolean().optional(),
    email_sent: boolean().optional(),
    url_link_deactivated: boolean().optional(),
    time_creation: string().optional(),
    slug: string().optional(),
    amount: number().optional(),
  })
  .primaryKey("invoice_id");

export const resourceModels = {
  demoContacts: demoContactsModel,
  customerJurisdictions: customerJurisdictionsModel,
  glAccounts: glAccountsModel,
  products: productsModel,
  customers: customersModel,
  invoices: invoicesModel,
} as const;

export type AthenaResourceModelName = keyof typeof resourceModels;
export type AthenaResourceModelRow<TModel extends AthenaResourceModelName> =
  RowOf<(typeof resourceModels)[TModel]>;
export type AthenaResourceModelColumn<TModel extends AthenaResourceModelName> =
  Extract<keyof AthenaResourceModelRow<TModel>, string>;
