import { spawn } from "node:child_process";
import { request as httpsRequest } from "node:https";

const requiredEnv = [
  "ATHENA_INTEGRATION_BASE_URL",
  "ATHENA_INTEGRATION_API_KEY",
  "ATHENA_INTEGRATION_USER_ID",
  "ATHENA_INTEGRATION_COMPANY_ID",
  "ATHENA_INTEGRATION_ORGANIZATION_ID",
];

const timestamp = Date.now();
const organizationId = process.env.ATHENA_INTEGRATION_ORGANIZATION_ID ?? "itest-org";

process.env.ATHENA_INTEGRATION_TABLE ??= "customers";
process.env.ATHENA_INTEGRATION_ID_COLUMN ??= "customer_id";
process.env.ATHENA_INTEGRATION_SELECT_COLUMNS ??=
  "customer_id,name,email,organization_id,created_at,updated_at";
process.env.ATHENA_INTEGRATION_INSERT_BODY_JSON ??= JSON.stringify({
  organization_id: organizationId,
  name: `Athena Integration ${timestamp}`,
  email: `athena.integration+${timestamp}@xylex.test`,
});
process.env.ATHENA_INTEGRATION_UPDATE_BODY_JSON ??= JSON.stringify({
  name: `Athena Integration Updated ${timestamp}`,
});
process.env.ATHENA_INTEGRATION_UPLOAD_OBJECT_PATH ??=
  `rsf/${organizationId}/customers/athena-integration`;
process.env.ATHENA_INTEGRATION_UPLOAD_BUCKET ??= "suitsconnect";

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("Missing Athena integration environment variables:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.error("Athena integration target:");
console.error(`- table: ${process.env.ATHENA_INTEGRATION_TABLE}`);
console.error(`- id column: ${process.env.ATHENA_INTEGRATION_ID_COLUMN}`);
console.error(`- storage catalog: ${process.env.ATHENA_INTEGRATION_STORAGE_S3_ID ?? "not configured"}`);
console.error(`- upload bucket: ${process.env.ATHENA_INTEGRATION_UPLOAD_BUCKET}`);

const timeoutMs = Number(process.env.ATHENA_INTEGRATION_TIMEOUT_MS ?? "180000");
const args = ["vitest", "run", "tests/athena-integration.test.ts"];

function detectFileRoutes() {
  return new Promise((resolve) => {
    const url = new URL("/storage/files/list", process.env.ATHENA_INTEGRATION_BASE_URL);
    const req = httpsRequest(
      url,
      {
        method: "OPTIONS",
        headers: {
          "X-User-Id": process.env.ATHENA_INTEGRATION_USER_ID,
          "X-Company-Id": process.env.ATHENA_INTEGRATION_COMPANY_ID,
          "X-Organization-Id": process.env.ATHENA_INTEGRATION_ORGANIZATION_ID,
        },
      },
      (res) => {
        resolve((res.statusCode ?? 0) !== 404);
        res.resume();
      },
    );

    req.on("error", () => resolve(false));
    req.end();
  });
}

const fileRoutesAvailable = await detectFileRoutes();
process.env.ATHENA_INTEGRATION_FILE_ROUTES_AVAILABLE = String(fileRoutesAvailable);

if (!fileRoutesAvailable) {
  console.error("Athena file routes are unavailable on this gateway; file integration tests will be skipped.");
}

const child = spawn("npx", args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

const timer = setTimeout(() => {
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), 5_000).unref();
  console.error(`Athena integration tests timed out after ${timeoutMs}ms.`);
}, timeoutMs);

child.on("exit", (code, signal) => {
  clearTimeout(timer);
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
