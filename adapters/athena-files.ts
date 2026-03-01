import { APP_CONFIG } from "@/lib/config";

export interface AthenaFileConfig {
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  requestId?: string;
  idempotencyKey?: string;
}

export interface AthenaUploadResponseData {
  id?: string;
  url?: string;
  file_url?: string;
  storage_key?: string;
  prefixPath?: string;
  time?: number;
  [key: string]: unknown;
}

export interface AthenaUploadResponse {
  data?: AthenaUploadResponseData;
  error?: string;
  message?: string;
}

export interface RefreshFileUrlParams {
  fileKey: string;
  bucket?: string | null;
}

export interface RefreshFileUrlResponse {
  success?: boolean;
  url?: string;
  expiresIn?: number;
  message?: string;
}

const DEFAULT_ATHENA_BASE_URL = "https://athena-db.com";

function getAthenaBaseUrl(): string {
  return APP_CONFIG.athena?.db_api_url ?? DEFAULT_ATHENA_BASE_URL;
}

function buildAthenaUrl(path: string, config?: AthenaFileConfig): string {
  return `${(config?.baseUrl ?? getAthenaBaseUrl()).replace(/\/$/, "")}${path}`;
}

function createRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `athena-file-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function buildFileHeaders(
  config: AthenaFileConfig | undefined,
  options: { isMutation: boolean; includeJsonContentType?: boolean },
): Record<string, string> {
  const requestId = config?.requestId ?? createRequestId();
  const apiKey =
    config?.apiKey ??
    process.env.ATHENA_INTEGRATION_API_KEY ??
    APP_CONFIG.athena?.api_key ??
    process.env.NEXT_PUBLIC_ATHENA_API_KEY ??
    process.env.ATHENA_API_KEY;
  const headers: Record<string, string> = {
    ...(config?.headers ?? {}),
    "X-Request-Id": requestId,
  };

  if (apiKey) {
    headers.apikey = apiKey;
    headers["x-api-key"] = apiKey;
  }

  if (options.includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (options.isMutation) {
    const idempotencyKey = config?.idempotencyKey ?? requestId;
    headers["Idempotency-Key"] = idempotencyKey;
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  return headers;
}

export async function uploadFileViaAthena(
  payload: FormData,
  config?: AthenaFileConfig,
): Promise<AthenaUploadResponseData> {
  const response = await fetch(buildAthenaUrl("/api/upload", config), {
    method: "POST",
    headers: buildFileHeaders(config, { isMutation: true }),
    body: payload,
  });

  const parsed = await response.json().catch(() => ({})) as AthenaUploadResponse;

  if (!response.ok || parsed?.error) {
    throw new Error(
      parsed?.error ||
        parsed?.message ||
        `Athena upload failed with status ${response.status}`,
    );
  }

  if (!parsed?.data) {
    throw new Error("Athena upload returned no data");
  }

  return parsed.data;
}

export async function refreshFileUrlViaAthena(
  params: RefreshFileUrlParams,
  config?: AthenaFileConfig,
): Promise<RefreshFileUrlResponse> {
  const response = await fetch(buildAthenaUrl("/api/files/refresh-url", config), {
    method: "POST",
    headers: buildFileHeaders(config, {
      isMutation: true,
      includeJsonContentType: true,
    }),
    body: JSON.stringify(params),
  });

  const parsed = await response.json().catch(() => ({})) as RefreshFileUrlResponse;

  if (!response.ok || !parsed?.url) {
    throw new Error(
      parsed?.message ||
        `Athena refresh-url failed with status ${response.status}`,
    );
  }

  return parsed;
}
