import { playgroundResourceFormRows } from "@/lib/resource-forms";
import {
  DEMO_COMPANY_ID,
  DEMO_ORGANIZATION_ID,
  demoContactRows,
} from "@/lib/demo-contacts";

export type DataCondition = {
  eq_column: string;
  eq_value: string | number | boolean | null;
};

type FetchDataParams = {
  table_name: string;
  schema?: string;
  conditions?: DataCondition[];
  columns?: string[];
  limit?: number;
  offset?: number;
};

type TableRow = Record<string, unknown>;
type TableData = TableRow[];

const DEMO_USER_ID = "demo-user";
const initialTables: Record<string, TableData> = {
  demo_contacts: demoContactRows.map((row) => ({ ...row })),
  user_preferences: [
    {
      id: "pref-1",
      user_id: DEMO_USER_ID,
      key: "timezone",
      value: "UTC",
    },
  ],
  user_permission_scopes: [
    {
      id: "scope-1",
      user_id: DEMO_USER_ID,
      company_id: DEMO_COMPANY_ID,
      organization_id: DEMO_ORGANIZATION_ID,
      scope: "admin",
      enabled: true,
      global: true,
    },
  ],
  notifications: [
    {
      id: "notif-1",
      company_id: DEMO_COMPANY_ID,
      message: "Demo notifications are working!",
      read: false,
    },
  ],
  v_flags: [
    {
      id: "flag-1",
      user_id: DEMO_USER_ID,
      flags: ["demo_enabled"],
    },
  ],
  resource_routes: [
    {
      id: "route-1",
      resource_name: "demo_contacts",
      table: "demo_contacts",
      id_column: "demo_contact_id",
      enable_search: true,
      search_by: "email_address",
      enable_new_resource_creation: true,
      columns: [
        { column_name: "demo_contact_id", hidden: true },
        { column_name: "first_name", header: "First name", order: 1 },
        { column_name: "last_name", header: "Last name", order: 2 },
        { column_name: "email_address", header: "Email", order: 3 },
        { column_name: "contact_number", header: "Primary phone", order: 4 },
        { column_name: "preferred_channel", header: "Preferred channel", order: 5 },
        { column_name: "notes", header: "Notes", order: 6 },
      ],
      searchBy: "email_address",
      sidebar_route: "/demo/contacts",
    },
  ],
  resource_forms: playgroundResourceFormRows.map((row) => ({
    ...row,
  })),
  resource_form_submissions: [],
  demo_contact_submissions: [],
  demo_kyc_submissions: [],
  demo_checkout_submissions: [],
};

const tableStore: Record<string, TableData> = {};
Object.entries(initialTables).forEach(([tableName, rows]) => {
  tableStore[tableName] = rows.map((row) => ({ ...row }));
});

const matchConditions = (
  row: TableRow,
  conditions?: DataCondition[],
): boolean => {
  if (!conditions?.length) return true;
  return conditions.every((condition) => {
    const value = row[condition.eq_column];
    if (condition.eq_value === null) {
      return value === null || value === undefined;
    }
    return String(value) === String(condition.eq_value);
  });
};

const projectColumns = (row: TableRow, columns?: string[]): TableRow => {
  if (!columns || columns.length === 0) {
    return { ...row };
  }
  const projected: TableRow = {};
  columns.forEach((column) => {
    if (column in row) {
      projected[column] = row[column];
    }
  });
  return projected;
};

const paginate = (rows: TableData, offset?: number, limit?: number) => {
  const start = offset ?? 0;
  if (limit == null) {
    return rows.slice(start);
  }
  return rows.slice(start, start + limit);
};

const getTableRows = (tableName: string): TableData => {
  if (!tableStore[tableName]) {
    tableStore[tableName] = [];
  }
  return tableStore[tableName];
};

export async function fetchData(params: FetchDataParams) {
  const {
    table_name,
    conditions,
    columns,
    limit,
    offset,
  } = params;
  const rows = getTableRows(table_name);
  const filtered = rows.filter((row) => matchConditions(row, conditions));
  const paged = paginate(filtered, offset, limit);
  const data = paged.map((row) => projectColumns(row, columns));
  return Promise.resolve({ data, error: null });
}
