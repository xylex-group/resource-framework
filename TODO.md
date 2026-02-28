# Athena API Gateway Migration TODO

Target: migrate all data and file operations in this package to Athena API Gateway using `https://athena-db.com/openapi.yaml`.

## Phase 0: Baseline and freeze points

- [ ] Inventory every current network path and classify by operation: read, write, upload, refresh-url, options, csv.
- [ ] Mark legacy endpoints and hardcoded fallbacks (including direct external update calls) as deprecated.
- [ ] Define migration freeze window for endpoint surface changes.
- [ ] Add baseline metrics dashboard: request count, error rate, p95/p99, and write success rate by route.

## Phase 1: Athena contract integration

- [ ] Generate typed Athena client from OpenAPI spec (`athena-db.com/openapi.yaml`).
- [ ] Define a single adapter interface for framework operations (`fetch`, `insert`, `update`, `delete`, `upload`, `refreshFileUrl`).
- [ ] Normalize Athena error payloads to one internal error shape used by hooks/components.
- [ ] Map auth/tenant headers from current context (`company_id`, `organization_id`, `user_id`) to Athena requirements.
- [ ] Add request id propagation (`x-request-id`) for tracing.

## Phase 2: Replace mutation/read paths

- [ ] Refactor `useApiClient` to use Athena adapter for all CRUD operations.
- [ ] Remove direct browser fallback calls to legacy external update endpoints.
- [ ] Migrate `handlers/handle-update.ts` and related handlers to Athena adapter.
- [ ] Ensure all write operations return canonical updated rows and align refetch behavior.
- [ ] Add idempotency key support for write endpoints where available.

## Phase 3: File pipeline migration

- [ ] Replace `/api/upload` integration with Athena-managed upload flow.
- [ ] Migrate signed URL refresh logic to Athena endpoint contract.
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
- [ ] Remove legacy adapters/endpoints and dead code.
- [ ] Update docs (`README.md`, `docs/08-http-adapters.md`, `docs/07-data-api.md`).

## Testing and acceptance criteria

- [ ] Unit tests for Athena adapter mappings and error normalization.
- [ ] Integration tests for CRUD and file workflows against Athena.
- [ ] Contract tests pinned to OpenAPI schema.
- [ ] Failure injection tests: timeout, 5xx, stale reads, partial file-write failures.
- [ ] Acceptance: no critical regressions, stable latency, and full removal of legacy direct endpoint usage.
