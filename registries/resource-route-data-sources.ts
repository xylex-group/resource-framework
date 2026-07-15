export const customerJurisdictionDataSource = {
  table: "customer_jurisdictions",
  value_column: "customer_jurisdiction_id",
  label_column: "name",
  search_column: "name",
} as const;

export const customersDataSource = {
  table: "customers",
  value_column: "customer_id",
  label_column: "name",
} as const;

