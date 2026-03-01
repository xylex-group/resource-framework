import { describe, expect, it } from "vitest";

import {
  deleteDataViaAthena,
  fetchDataViaAthena,
  insertDataViaAthena,
  updateDataViaAthena,
} from "../adapters/athena-gateway";
import {
  refreshFileUrlViaAthena,
  uploadFileViaAthena,
} from "../adapters/athena-files";

// Real-environment tests. They are skipped unless the required ATHENA_INTEGRATION_*
// environment variables are present for a writable test table and file endpoint.
const env = {
  baseUrl: process.env.ATHENA_INTEGRATION_BASE_URL,
  apiKey: process.env.ATHENA_INTEGRATION_API_KEY,
  client: process.env.ATHENA_INTEGRATION_CLIENT ?? "railway_direct",
  userId: process.env.ATHENA_INTEGRATION_USER_ID,
  companyId: process.env.ATHENA_INTEGRATION_COMPANY_ID,
  organizationId: process.env.ATHENA_INTEGRATION_ORGANIZATION_ID,
  table: process.env.ATHENA_INTEGRATION_TABLE,
  idColumn: process.env.ATHENA_INTEGRATION_ID_COLUMN,
  selectColumns: process.env.ATHENA_INTEGRATION_SELECT_COLUMNS,
  insertBodyJson: process.env.ATHENA_INTEGRATION_INSERT_BODY_JSON,
  updateBodyJson: process.env.ATHENA_INTEGRATION_UPDATE_BODY_JSON,
  uploadProjectId: process.env.ATHENA_INTEGRATION_UPLOAD_PROJECT_ID,
  uploadObjectPath: process.env.ATHENA_INTEGRATION_UPLOAD_OBJECT_PATH,
  uploadBucket: process.env.ATHENA_INTEGRATION_UPLOAD_BUCKET,
};

const hasCrudEnv = Boolean(
  env.baseUrl &&
    env.apiKey &&
    env.userId &&
    env.companyId &&
    env.organizationId &&
    env.table &&
    env.idColumn &&
    env.insertBodyJson &&
    env.updateBodyJson,
);

const hasFileEnv = Boolean(
  env.baseUrl &&
    env.apiKey &&
    env.userId &&
    env.companyId &&
    env.organizationId &&
    env.uploadProjectId &&
    env.uploadObjectPath &&
    env.uploadBucket,
);

const fileRoutesAvailable = process.env.ATHENA_INTEGRATION_FILE_ROUTES_AVAILABLE !== "false";

function buildHeaders() {
  return {
    "X-User-Id": env.userId ?? "",
    "X-Company-Id": env.companyId ?? "",
    "X-Organization-Id": env.organizationId ?? "",
  };
}

describe.skipIf(!hasCrudEnv)("Athena integration: CRUD", () => {
  it("performs insert, fetch, update, and delete against a real Athena environment", async () => {
    const insertBody = JSON.parse(env.insertBodyJson ?? "{}") as Record<string, unknown>;
    const updateBody = JSON.parse(env.updateBodyJson ?? "{}") as Record<string, unknown>;
    const traceId = `itest-${Date.now()}`;

    const inserted = await insertDataViaAthena<Record<string, unknown>>(
      {
        table_name: env.table!,
        insert_body: insertBody,
        columns: env.selectColumns?.split(",").map((value) => value.trim()),
      },
      {
        baseUrl: env.baseUrl,
        apiKey: env.apiKey,
        client: env.client,
        headers: buildHeaders(),
        requestId: `${traceId}-insert`,
        idempotencyKey: `${traceId}-insert`,
      },
    );

    expect(inserted.error).toBeNull();
    expect(inserted.data).toBeTruthy();

    const createdRow = inserted.data as Record<string, unknown>;
    const recordId = String(
      createdRow[env.idColumn!] ??
        createdRow.resource_id ??
        createdRow.id,
    );

    expect(recordId).toBeTruthy();

    const fetched = await fetchDataViaAthena<Record<string, unknown>[]>(
      {
        table_name: env.table!,
        conditions: [{ eq_column: env.idColumn!, eq_value: recordId }],
        columns: env.selectColumns?.split(",").map((value) => value.trim()),
        limit: 1,
      },
      {
        baseUrl: env.baseUrl,
        apiKey: env.apiKey,
        client: env.client,
        headers: buildHeaders(),
        requestId: `${traceId}-fetch`,
      },
    );

    expect(fetched.error).toBeNull();
    expect(Array.isArray(fetched.data)).toBe(true);
    expect(fetched.data?.length).toBeGreaterThan(0);

    const updated = await updateDataViaAthena<Record<string, unknown>>(
      {
        table_name: env.table!,
        x_column: env.idColumn!,
        x_id: recordId,
        update_body: updateBody,
      },
      {
        baseUrl: env.baseUrl,
        apiKey: env.apiKey,
        client: env.client,
        headers: buildHeaders(),
        requestId: `${traceId}-update`,
        idempotencyKey: `${traceId}-update`,
      },
    );

    expect(updated.error).toBeNull();
    expect(updated.data).toBeTruthy();

    const deleted = await deleteDataViaAthena<Record<string, unknown>>(
      {
        table_name: env.table!,
        x_column: env.idColumn!,
        x_id: recordId,
      },
      {
        baseUrl: env.baseUrl,
        apiKey: env.apiKey,
        client: env.client,
        headers: buildHeaders(),
        requestId: `${traceId}-delete`,
        idempotencyKey: `${traceId}-delete`,
      },
    );

    expect(deleted.error).toBeNull();
  }, 60_000);
});

describe.skipIf(!hasFileEnv || !fileRoutesAvailable)("Athena integration: files", () => {
  it("uploads a file and refreshes its signed URL against a real Athena environment", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["athena integration test"], { type: "text/plain" }),
      `athena-integration-${Date.now()}.txt`,
    );
    formData.append("projectId", env.uploadProjectId!);
    formData.append("resolvedOrganizationId", env.organizationId!);
    formData.append("objectPath", env.uploadObjectPath!);

    const uploaded = await uploadFileViaAthena(formData, {
      baseUrl: env.baseUrl,
      apiKey: env.apiKey,
      headers: buildHeaders(),
      requestId: `itest-file-upload-${Date.now()}`,
      idempotencyKey: `itest-file-upload-${Date.now()}`,
    });

    expect(uploaded.url || uploaded.file_url).toBeTruthy();
    expect(uploaded.storage_key).toBeTruthy();

    const refreshed = await refreshFileUrlViaAthena(
      {
        fileKey: String(uploaded.storage_key),
        bucket: env.uploadBucket!,
      },
      {
        baseUrl: env.baseUrl,
        apiKey: env.apiKey,
        headers: buildHeaders(),
        requestId: `itest-file-refresh-${Date.now()}`,
        idempotencyKey: `itest-file-refresh-${Date.now()}`,
      },
    );

    expect(refreshed.url).toBeTruthy();
  }, 60_000);
});
