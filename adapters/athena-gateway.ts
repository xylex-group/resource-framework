import type {
  AthenaJsonPrimitive,
  AthenaJsonValue,
} from "@xylex-group/athena/browser";
import {
  createAthenaAdapterClient,
  type AthenaAdapterConfig,
} from "./athena-client-config";

type AthenaRow = Record<string, AthenaJsonValue>;
type AthenaWriteRow = Partial<AthenaRow>;

export interface DataCondition {
  eq_column: string;
  eq_value: AthenaJsonPrimitive;
}

export interface DataResponse<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface FetchDataParams {
  table_name: string;
  schema?: string;
  conditions?: DataCondition[];
  columns?: string[];
  limit?: number;
  offset?: number;
  order_by?: string;
}

export interface InsertDataParams {
  table_name: string;
  schema?: string;
  insert_body: Record<string, unknown> | Record<string, unknown>[];
  columns?: string[];
}

export interface UpdateDataParams {
  table_name: string;
  schema?: string;
  x_column?: string;
  x_id?: string | number;
  update_body?: Record<string, unknown>;
  limit?: number;
}

export interface DeleteDataParams {
  table_name: string;
  schema?: string;
  x_column?: string;
  x_id?: string | number;
  update_body?: Record<string, unknown>;
}

export type AthenaGatewayConfig = AthenaAdapterConfig;

function toAthenaJsonValue(value: unknown): AthenaJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Athena payload numbers must be finite.");
    }
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => toAthenaJsonValue(item) ?? null);
  }
  if (typeof value === "object") {
    const normalized: Record<string, AthenaJsonValue> = {};
    for (const [key, item] of Object.entries(value)) {
      const normalizedItem = toAthenaJsonValue(item);
      if (normalizedItem !== undefined) normalized[key] = normalizedItem;
    }
    return normalized;
  }
  throw new TypeError(`Athena payload contains unsupported ${typeof value} data.`);
}

function toAthenaWriteRow(value: Record<string, unknown>): AthenaWriteRow {
  return toAthenaJsonValue(value) as AthenaWriteRow;
}

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }

  return (value ?? null) as T | null;
}

function parseOrderBy(orderBy: string): { column: string; ascending: boolean } {
  const match = orderBy.trim().match(/^([^\s,]+)(?:[\s.]+(asc|desc))?$/i);
  if (!match?.[1]) {
    throw new TypeError(`Invalid Athena order_by value: ${orderBy}`);
  }

  return {
    column: match[1],
    ascending: match[2]?.toLowerCase() !== "desc",
  };
}

export async function fetchDataViaAthena<T = unknown[]>(
  params: FetchDataParams,
  config?: AthenaGatewayConfig,
): Promise<DataResponse<T>> {
  try {
    const athena = createAthenaAdapterClient(config, { mutation: false });
    const columns = params.columns?.length ? params.columns.join(", ") : "*";
    let query = params.schema
      ? athena.from<AthenaRow, AthenaWriteRow, AthenaWriteRow>(
        params.table_name,
        { schema: params.schema },
      )
      : athena.from<AthenaRow, AthenaWriteRow, AthenaWriteRow>(params.table_name);

    for (const condition of params.conditions ?? []) {
      query = query.eq(condition.eq_column, condition.eq_value);
    }

    if (params.order_by) {
      const order = parseOrderBy(params.order_by);
      query = query.order(order.column, { ascending: order.ascending });
    }

    if (typeof params.offset === "number") {
      query = query.offset(params.offset);
    }

    if (typeof params.limit === "number") {
      query = query.limit(params.limit);
    }

    const response = await query.select(columns);
    return {
      data: (response.data as T | null) ?? null,
      error: response.error?.message ?? null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function insertDataViaAthena<T = unknown>(
  params: InsertDataParams,
  config?: AthenaGatewayConfig,
): Promise<DataResponse<T>> {
  try {
    const athena = createAthenaAdapterClient(config, { mutation: true });
    const columns = params.columns?.length ? params.columns.join(", ") : "*";
    const table = params.schema
      ? athena.from<AthenaRow, AthenaWriteRow, AthenaWriteRow>(
        params.table_name,
        { schema: params.schema },
      )
      : athena.from<AthenaRow, AthenaWriteRow, AthenaWriteRow>(params.table_name);
    const mutation = Array.isArray(params.insert_body)
      ? table.insert(params.insert_body.map(toAthenaWriteRow))
      : table.insert(toAthenaWriteRow(params.insert_body));
    const response = await mutation.select(columns);

    return {
      data: (Array.isArray(params.insert_body)
        ? response.data
        : firstRow(response.data)) as T | null,
      error: response.error?.message ?? null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateDataViaAthena<T = unknown>(
  params: UpdateDataParams,
  config?: AthenaGatewayConfig,
): Promise<DataResponse<T>> {
  try {
    const athena = createAthenaAdapterClient(config, { mutation: true });
    const table = params.schema
      ? athena.from<AthenaRow, AthenaWriteRow, AthenaWriteRow>(
        params.table_name,
        { schema: params.schema },
      )
      : athena.from<AthenaRow, AthenaWriteRow, AthenaWriteRow>(params.table_name);
    let query = table.update(toAthenaWriteRow(params.update_body ?? {}));

    if (params.x_column && params.x_id !== undefined) {
      query = query.eq(params.x_column, params.x_id);
    }

    if (typeof params.limit === "number") {
      query = query.limit(params.limit);
    }

    const response = await query.select("*");
    return {
      data: firstRow(response.data) as T | null,
      error: response.error?.message ?? null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteDataViaAthena<T = unknown>(
  params: DeleteDataParams,
  config?: AthenaGatewayConfig,
): Promise<DataResponse<T>> {
  try {
    const athena = createAthenaAdapterClient(config, { mutation: true });
    let query = params.schema
      ? athena.from<AthenaRow, AthenaWriteRow, AthenaWriteRow>(
        params.table_name,
        { schema: params.schema },
      )
      : athena.from<AthenaRow, AthenaWriteRow, AthenaWriteRow>(params.table_name);

    if (params.x_column && params.x_id !== undefined) {
      query = query.eq(params.x_column, params.x_id);
    }

    const response = await query.delete({
      resourceId: params.x_id != null ? String(params.x_id) : undefined,
    }).select("*");

    return {
      data: firstRow(response.data) as T | null,
      error: response.error?.message ?? null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
