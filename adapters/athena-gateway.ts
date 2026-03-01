import { Backend, createClient } from "@xylex-group/athena";
import { APP_CONFIG } from "@/lib/config";

export interface DataCondition {
  eq_column: string;
  eq_value: string | number | boolean | null;
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

type AthenaGatewayMethod = "POST" | "PUT" | "DELETE";

type AthenaGatewayCondition = {
  column: string;
  operator: "eq";
  value: string | number | boolean | null;
};

export interface AthenaGatewayConfig {
  baseUrl?: string;
  client?: string;
  headers?: Record<string, string>;
  requestId?: string;
  idempotencyKey?: string;
}

const DEFAULT_ATHENA_BASE_URL = "https://athena-db.com";
const DEFAULT_ATHENA_CLIENT = "railway_direct";

function getAthenaBaseUrl(): string {
  return APP_CONFIG.athena?.db_api_url ?? DEFAULT_ATHENA_BASE_URL;
}

function getAthenaClient(): string {
  return APP_CONFIG.athena?.standard_client ?? DEFAULT_ATHENA_CLIENT;
}

function getAthenaApiKey(): string {
  return (
    APP_CONFIG.athena?.api_key ??
    process.env.NEXT_PUBLIC_ATHENA_API_KEY ??
    process.env.ATHENA_API_KEY ??
    ""
  );
}

function createAthenaSdkClient(config: AthenaGatewayConfig = {}) {
  const headers = buildAthenaHeaders(config, { isMutation: false });
  return createClient(
    config.baseUrl ?? getAthenaBaseUrl(),
    getAthenaApiKey(),
    {
      client: config.client ?? getAthenaClient(),
      backend: Backend.Athena,
      headers,
    },
  );
}

function createRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `athena-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function buildAthenaHeaders(
  config: AthenaGatewayConfig = {},
  options: { isMutation: boolean },
): Record<string, string> {
  const requestId = config.requestId ?? createRequestId();
  const headers: Record<string, string> = {
    ...(config.headers ?? {}),
    "X-Request-Id": requestId,
  };

  if (options.isMutation) {
    const idempotencyKey = config.idempotencyKey ?? requestId;
    headers["Idempotency-Key"] = idempotencyKey;
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  return headers;
}

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }

  return (value ?? null) as T | null;
}

function toAthenaConditions(
  conditions: DataCondition[] | undefined,
): AthenaGatewayCondition[] | undefined {
  if (!conditions?.length) {
    return undefined;
  }

  return conditions.map((condition) => ({
    column: condition.eq_column,
    operator: "eq",
    value: condition.eq_value,
  }));
}

function normalizePayload<T>(payload: unknown): DataResponse<T> {
  const record =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;

  const error =
    record && typeof record.error === "string"
      ? record.error
      : record && typeof record.message === "string"
        ? record.message
        : null;

  const data = record && "data" in record ? (record.data as T) : (payload as T);

  return {
    data: (data ?? null) as T | null,
    error,
  };
}

export async function fetchDataViaAthena<T = unknown[]>(
  params: FetchDataParams,
  config?: AthenaGatewayConfig,
): Promise<DataResponse<T>> {
  try {
    const athena = createAthenaSdkClient({
      ...config,
      headers: buildAthenaHeaders(config, { isMutation: false }),
    });
    const columns = params.columns?.length ? params.columns.join(", ") : "*";
    let query = athena.from<T extends Array<infer Row> ? Row : T>(params.table_name);

    for (const condition of params.conditions ?? []) {
      query = query.eq(condition.eq_column, condition.eq_value);
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
      error: response.error,
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
    const athena = createAthenaSdkClient({
      ...config,
      headers: buildAthenaHeaders(config, { isMutation: true }),
    });
    const columns = params.columns?.length ? params.columns.join(", ") : "*";
    const response = await athena
      .from(params.table_name)
      .insert(params.insert_body)
      .select(columns);

    return {
      data: (Array.isArray(params.insert_body)
        ? response.data
        : firstRow(response.data)) as T | null,
      error: response.error,
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
    const athena = createAthenaSdkClient({
      ...config,
      headers: buildAthenaHeaders(config, { isMutation: true }),
    });
    let query = athena.from(params.table_name).update(params.update_body ?? {});

    if (params.x_column && params.x_id !== undefined) {
      query = query.eq(params.x_column, params.x_id);
    }

    if (typeof params.limit === "number") {
      query = query.limit(params.limit);
    }

    const response = await query.select("*");
    return {
      data: firstRow(response.data) as T | null,
      error: response.error,
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
    const athena = createAthenaSdkClient({
      ...config,
      headers: buildAthenaHeaders(config, { isMutation: true }),
    });
    let query = athena.from(params.table_name);

    if (params.x_column && params.x_id !== undefined) {
      query = query.eq(params.x_column, params.x_id);
    }

    const response = await query.delete({
      resourceId: params.x_id != null ? String(params.x_id) : undefined,
    }).select("*");

    return {
      data: firstRow(response.data) as T | null,
      error: response.error,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
