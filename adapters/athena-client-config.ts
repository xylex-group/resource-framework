import { APP_CONFIG } from "@/lib/config";
import { createAthenaBrowserClient } from "@xylex-group/athena/next/client";

export interface AthenaAdapterConfig {
  baseUrl?: string;
  apiKey?: string;
  client?: string;
  headers?: Record<string, string>;
  requestId?: string;
  idempotencyKey?: string;
  s3Id?: string;
}

const DEFAULT_ATHENA_BASE_URL = "https://athena-db.com";
const DEFAULT_ATHENA_CLIENT = "railway_direct";

function createRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `athena-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function resolveAthenaAdapterConfig(
  config: AthenaAdapterConfig = {},
  options: { mutation: boolean },
) {
  const requestId = config.requestId ?? createRequestId();
  const headers: Record<string, string> = {
    ...(config.headers ?? {}),
    "X-Request-Id": requestId,
  };

  if (options.mutation) {
    const idempotencyKey = config.idempotencyKey ?? requestId;
    headers["Idempotency-Key"] = idempotencyKey;
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  return {
    url: config.baseUrl ?? APP_CONFIG.athena?.db_api_url ?? DEFAULT_ATHENA_BASE_URL,
    key:
      config.apiKey ??
      process.env.ATHENA_INTEGRATION_API_KEY ??
      APP_CONFIG.athena?.api_key ??
      process.env.NEXT_PUBLIC_ATHENA_API_KEY ??
      process.env.ATHENA_API_KEY ??
      "",
    client:
      config.client ??
      APP_CONFIG.athena?.standard_client ??
      process.env.NEXT_PUBLIC_ATHENA_CLIENT ??
      DEFAULT_ATHENA_CLIENT,
    headers,
  };
}

export function resolveAthenaStorageCatalogId(
  config: AthenaAdapterConfig = {},
): string {
  const s3Id =
    config.s3Id ??
    APP_CONFIG.athena?.storage_s3_id ??
    process.env.NEXT_PUBLIC_ATHENA_STORAGE_S3_ID ??
    process.env.ATHENA_STORAGE_S3_ID ??
    "";

  if (!s3Id) {
    throw new Error(
      "Athena managed storage requires an s3Id or NEXT_PUBLIC_ATHENA_STORAGE_S3_ID.",
    );
  }

  return s3Id;
}

export function createAthenaAdapterClient(
  config: AthenaAdapterConfig | undefined,
  options: { mutation: boolean },
) {
  return createAthenaBrowserClient(resolveAthenaAdapterConfig(config, options));
}

export function createAthenaStorageClient(config?: AthenaAdapterConfig) {
  return createAthenaBrowserClient({
    ...resolveAthenaAdapterConfig(config, { mutation: true }),
    storage: true,
  });
}
