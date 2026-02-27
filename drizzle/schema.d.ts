export declare const demo_contacts: {
  $inferSelect: {
    demo_contact_id: string;
    first_name: string;
    last_name: string;
    email_address: string;
    contact_number: string;
    company_id: string;
    organization_id: string;
    created_at: string;
    updated_at: string;
  };
  _: unknown;
};

export declare const customerJurisdictions: {
  $inferSelect: {
    id: string;
    name: string;
  };
  _: unknown;
};

export declare const glAccounts: {
  $inferSelect: {
    id: string;
    description: string;
  };
  _: unknown;
};

export declare const products: {
  $inferSelect: {
    id: string;
    name: string;
  };
  _: unknown;
};

export declare const customers: {
  $inferSelect: {
    id: string;
    company_name: string;
  };
  _: unknown;
};

export declare const invoices: {
  $inferSelect: {
    id: string;
    amount: number;
  };
  _: unknown;
};

const schema: {
  demo_contacts: typeof demo_contacts;
  customerJurisdictions: typeof customerJurisdictions;
  glAccounts: typeof glAccounts;
  products: typeof products;
  customers: typeof customers;
  invoices: typeof invoices;
};

export default schema;
