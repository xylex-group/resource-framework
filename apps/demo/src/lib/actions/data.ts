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

type InsertDataParams = {
  table_name: string;
  schema?: string;
  insert_body: Record<string, unknown> | Record<string, unknown>[];
};

type UpdateDataParams = {
  table_name: string;
  schema?: string;
  x_column?: string;
  x_id?: string | number;
  update_body: Record<string, unknown>;
};

type DeleteDataParams = {
  table_name: string;
  schema?: string;
  x_column?: string;
  x_id?: string | number;
  update_body?: Record<string, unknown>;
};

type TableRow = Record<string, unknown>;
type TableData = TableRow[];

const DEMO_USER_ID = "demo-user";
const DEMO_COMPANY_ID = "demo-company";
const DEMO_ORGANIZATION_ID = "demo-organization";

const initialTables: Record<string, TableData> = {
  demo_contacts: [
    {
      demo_contact_id: "1",
      first_name: "Alex",
      last_name: "Rivera",
      email_address: "alex@example.com",
      contact_number: "+1 555 0100",
      home_country: "US",
      preferred_channel: "phone_email",
      notes: "Share product updates outside weekends.",
      company_id: DEMO_COMPANY_ID,
      organization_id: DEMO_ORGANIZATION_ID,
      created_at: "2024-12-01T10:00:00.000Z",
      updated_at: "2024-12-05T08:30:00.000Z",
    },
    {
      demo_contact_id: "2",
      first_name: "Jamie",
      last_name: "Santos",
      email_address: "jamie@demo.com",
      contact_number: "+1 555 0101",
      home_country: "CA",
      preferred_channel: "email",
      notes: "Always include invoice copies when contacting.",
      company_id: DEMO_COMPANY_ID,
      organization_id: DEMO_ORGANIZATION_ID,
      created_at: "2025-01-15T15:12:00.000Z",
      updated_at: "2025-01-18T09:45:00.000Z",
    },
    {
      demo_contact_id: "3",
      first_name: "Samira",
      last_name: "Vega",
      email_address: "samira@demo.com",
      contact_number: "+1 555 0102",
      home_country: "GB",
      preferred_channel: "sms",
      notes: "No SMS after 7pm.",
      company_id: DEMO_COMPANY_ID,
      organization_id: DEMO_ORGANIZATION_ID,
      created_at: "2025-02-03T11:20:00.000Z",
      updated_at: "2025-02-07T14:55:00.000Z",
    },
    {
      demo_contact_id: "4",
      first_name: "Jin",
      last_name: "Park",
      email_address: "jin@demo.com",
      contact_number: "+1 555 0103",
      home_country: "KR",
      preferred_channel: "email",
      notes: "Prefers short summaries.",
      company_id: DEMO_COMPANY_ID,
      organization_id: DEMO_ORGANIZATION_ID,
      created_at: "2025-02-25T09:15:00.000Z",
      updated_at: "2025-03-01T13:40:00.000Z",
    },
  ],
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
};

const tableStore: Record<string, TableData> = {};
const idCounters: Record<string, number> = {};

Object.entries(initialTables).forEach(([tableName, rows]) => {
  tableStore[tableName] = rows.map((row) => ({ ...row }));
  idCounters[tableName] = rows.length;
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
    idCounters[tableName] = 0;
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

const assignPrimaryKey = (params: InsertDataParams): TableRow => {
  const idColumn = params.table_name === "demo_contacts"
    ? "demo_contact_id"
    : "id";
  const nextId = (idCounters[params.table_name] || 0) + 1;
  idCounters[params.table_name] = nextId;
  return {
    ...Array.isArray(params.insert_body) ? {} : params.insert_body,
    [idColumn]: params.table_name === "demo_contacts"
      ? String(nextId)
      : nextId,
  };
};

export async function insertData(params: InsertDataParams) {
  const bodyArray = Array.isArray(params.insert_body)
    ? params.insert_body
    : [params.insert_body];
  const createdRows: TableRow[] = [];
  bodyArray.forEach((body) => {
    const newRow = assignPrimaryKey({
      ...params,
      insert_body: body,
      table_name: params.table_name,
    });
    const row = { ...body, ...newRow };
    tableStore[params.table_name] = [
      ...(tableStore[params.table_name] || []),
      row,
    ];
    createdRows.push(row);
  });
  return Promise.resolve({ data: createdRows, error: null });
}

export async function updateData(params: UpdateDataParams) {
  const table = getTableRows(params.table_name);
  const targetColumn = params.x_column || "id";
  const targetId = params.x_id;
  const updatedRows: TableRow[] = [];
  const next = table.map((row) => {
    if (targetId != null && row[targetColumn] === targetId) {
      const updated = { ...row, ...params.update_body };
      updatedRows.push(updated);
      return updated;
    }
    return row;
  });
  tableStore[params.table_name] = next;
  if (updatedRows.length === 0) {
    return Promise.resolve({ data: null, error: `Record not found` });
  }
  return Promise.resolve({ data: updatedRows[0], error: null });
}

export async function deleteData(params: DeleteDataParams) {
  const table = getTableRows(params.table_name);
  const targetColumn = params.x_column || "id";
  const targetId = params.x_id;
  let deleted: TableRow | null = null;
  tableStore[params.table_name] = table.filter((row) => {
    if (targetId != null && row[targetColumn] === targetId) {
      deleted = row;
      return false;
    }
    return true;
  });
  return Promise.resolve({ data: deleted, error: null });
}
