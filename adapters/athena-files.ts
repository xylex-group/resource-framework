import type {
  AthenaStorageFileUploadInput,
  AthenaStorageFileModule,
  AthenaStorageFileUploadResult,
  ManagedFileRecord,
} from "@xylex-group/athena/browser";
import {
  createAthenaStorageClient,
  type AthenaAdapterConfig,
  resolveAthenaStorageCatalogId,
} from "./athena-client-config";

export type AthenaFileConfig = AthenaAdapterConfig;

export type AthenaFileUploadInput = Omit<AthenaStorageFileUploadInput, "s3_id"> & {
  s3_id?: string;
};

export interface RefreshFileUrlParams {
  fileId?: string;
  fileKey?: string;
  bucket?: string | null;
  s3Id?: string;
  purpose?: "download" | "preview" | "stream";
}

export interface RefreshFileUrlResponse {
  success: true;
  fileId: string;
  url: string;
  expiresIn?: number;
}

function createStorageClient(config?: AthenaFileConfig) {
  return createAthenaStorageClient(config);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

async function resolveManagedFile(
  params: RefreshFileUrlParams,
  config?: AthenaFileConfig,
): Promise<ManagedFileRecord> {
  if (!params.fileKey) {
    throw new Error("Refreshing an Athena file URL requires fileId or fileKey.");
  }

  const client = createStorageClient(config);
  const s3Id = resolveAthenaStorageCatalogId({
    ...config,
    s3Id: params.s3Id ?? config?.s3Id,
  });
  const page = await client.storage.file.list({
    s3_id: s3Id,
    prefix: params.fileKey,
    bucket: params.bucket ?? undefined,
    limit: 100,
  });
  const file = page.files.find((item) => item.storage_key === params.fileKey);

  if (!file) {
    throw new Error(`Athena managed file was not found for key ${params.fileKey}.`);
  }

  return file;
}

export async function uploadFileViaAthena(
  input: AthenaFileUploadInput,
  config?: AthenaFileConfig,
): Promise<AthenaStorageFileUploadResult> {
  const client = createStorageClient(config);
  const s3Id = input.s3_id || resolveAthenaStorageCatalogId(config);

  const upload = client.storage.file.upload as AthenaStorageFileModule["upload"];
  return upload({ ...input, s3_id: s3Id });
}

export async function refreshFileUrlViaAthena(
  params: RefreshFileUrlParams,
  config?: AthenaFileConfig,
): Promise<RefreshFileUrlResponse> {
  const client = createStorageClient(config);
  const fileId = params.fileId ?? (await resolveManagedFile(params, config)).id;
  const response = await client.storage.file.proxyUrl(fileId, {
    purpose: params.purpose ?? "stream",
  });
  const url = readString(response.url);

  if (!url) {
    throw new Error(`Athena returned no proxy URL for managed file ${fileId}.`);
  }

  return {
    success: true,
    fileId,
    url,
    expiresIn:
      readNumber(response.expires_in) ??
      readNumber(response.expiresIn),
  };
}
