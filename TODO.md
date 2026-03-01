# Athena API Gateway Migration TODO

Target: migrate all data and file operations in this package to Athena API Gateway using `https://athena-db.com/openapi.yaml`.

## Phase 0: Baseline and freeze points

- [ ] Inventory every current network path and classify by operation: read, write, upload, refresh-url, options, csv.
- [ ] Mark legacy endpoints and hardcoded fallbacks (including direct external update calls) as deprecated.
- [ ] Define migration freeze window for endpoint surface changes.
- [ ] Add baseline metrics dashboard: request count, error rate, p95/p99, and write success rate by route.

## Phase 1: Athena contract integration

- [x] Use the typed Athena SDK (`@xylex-group/athena`) as the package transport.
- [x] Define a single adapter interface for framework operations (`fetch`, `insert`, `update`, `delete`, `upload`, `refreshFileUrl`).
- [x] Normalize Athena error payloads to one internal error shape used by hooks/components.
- [x] Map auth/tenant headers from current context (`company_id`, `organization_id`, `user_id`) to Athena requirements.
- [x] Add request id propagation (`x-request-id`) for tracing.

## Phase 2: Replace mutation/read paths

- [x] Refactor `useApiClient` to use Athena adapter for all CRUD operations.
- [x] Remove direct browser fallback calls to legacy external update endpoints.
- [x] Migrate `handlers/handle-update.ts` and related handlers to Athena adapter.
- [ ] Ensure all write operations return canonical updated rows and align refetch behavior.
- [x] Add idempotency key support for write endpoints where available.

## Phase 3: File pipeline migration

- [x] Replace `/api/upload` integration with Athena-managed upload flow.
- [x] Migrate signed URL refresh logic to Athena endpoint contract.
- [ ] Ensure file metadata write + object write consistency (transaction or saga/compensation).
- [ ] Add reconciliation job spec for orphan object detection and cleanup.
- [ ] Validate URL expiry semantics and proactive refresh strategy.

## Phase 4: Reliability and security hardening

- [ ] Add retry policy by operation class (safe reads vs idempotent writes).
- [ ] Add circuit-breaker behavior for Athena outage scenarios.
- [ ] Remove any client-embedded API keys/secrets.
- [ ] Enforce server-side scoped auth for privileged operations.
- [ ] Add audit logging for all mutation endpoints.

## Phase 5: Cutover and cleanup

- [ ] Gate migration with feature flags per resource route.
- [ ] Run dual-read or shadow verification on selected resources.
- [ ] Perform staged rollout (internal -> limited tenants -> full traffic).
- [x] Remove legacy adapters/endpoints and dead code.
- [x] Update docs (`README.md`, `docs/08-http-adapters.md`, `docs/07-data-api.md`).

## Testing and acceptance criteria

- [x] Unit tests for Athena adapter mappings and error normalization.
- [x] Integration tests for CRUD and file workflows against Athena (env-gated).
- [x] Contract tests for the framework-facing Athena adapter contract.
- [x] Add a dedicated `test:integration` runner with env validation and timeout handling.
- [ ] Failure injection tests: timeout, 5xx, stale reads, partial file-write failures.
- [ ] Acceptance: no critical regressions, stable latency, and full removal of legacy direct endpoint usage.
