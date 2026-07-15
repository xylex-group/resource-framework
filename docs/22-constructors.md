# Constructors

Resource constructors derive their useful table and column constraints from Athena models.

## Athena Routes

```ts
import {
  defineAthenaColumns,
  defineAthenaResourceRoute,
} from "@xylex-group/resource-framework";

const columns = defineAthenaColumns<"invoices">([
  { column_name: "invoice_id", hidden: true },
  { column_name: "invoice_nr", header: "Invoice number" },
  { column_name: "paid", field_type: "boolean" },
]);

export const invoicesRoute = defineAthenaResourceRoute("invoices", {
  table: "invoices",
  idColumn: "invoice_id",
  companyIdColumn: "organization_id",
  columns,
});
```

`defineAthenaResourceRoute` stores the Athena model name on the route. `defineAthenaColumns` derives column keys and basic value types from the model row.

## Generic Columns

Use `defineColumns` when a route does not yet have a registered Athena model:

```ts
import { defineColumns } from "@xylex-group/resource-framework";

const columns = defineColumns([
  { column_name: "name" },
  { column_name: "enabled", field_type: "boolean" },
]);
```

Register high-value tables in `athena/models/resource-models.ts` rather than maintaining duplicate table interfaces or schema snapshots.
