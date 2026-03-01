import { APP_CONFIG } from "@/lib/config";

interface AthenaFileConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
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

export async function uploadFileViaAthena(
  payload: FormData,
  config?: AthenaFileConfig,
): Promise<AthenaUploadResponseData> {
  const response = await fetch(buildAthenaUrl("/api/upload", config), {
    method: "POST",
    headers: config?.headers,
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
    headers: {
      "Content-Type": "application/json",
      ...(config?.headers ?? {}),
    },
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
