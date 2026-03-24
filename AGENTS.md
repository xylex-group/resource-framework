# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a **pnpm + Turborepo** monorepo for `@xylex-group/resource-framework`, a metadata-driven UI framework built on Drizzle ORM. It contains a root library package and two Next.js 16 demo apps (`apps/demo` on port 3000, `apps/playground-next` on port 3001).

### Running services

- **Library build**: `pnpm build` (Rollup + tsc, outputs to `dist/`)
- **Demo app**: `pnpm --filter @xylex-group/demo-app dev --port 3000`
- **Playground app**: `pnpm --filter @xylex-group/playground-next dev --port 3001`
- **Both apps in parallel**: `pnpm dev` (uses Turbo)

### Lint / Test / Typecheck

Standard commands per `package.json` scripts:

- `pnpm lint` — ESLint on the root package
- `pnpm test` — Vitest unit tests (no network needed)
- `pnpm typecheck` — workspace-wide TypeScript check via `scripts/typecheck-workspaces.mjs`

### Known issues (pre-existing)

- **Typecheck `demo-app` step fails**: Root package files import `next/navigation` but `next` is only a dependency of the apps, not the root. The `package` typecheck step (first step) passes; the failure occurs when the demo tsconfig pulls in root library sources.
- **`resource-forms-admin-client.test.tsx` fails in Vitest**: The playground test file can't resolve `next/navigation` during Vite module analysis. All other 22 test suites pass.
- **Demo table page (`/demo/contacts`)**: Has a client-side hydration error because it needs the external Athena API gateway which is not available locally. The home page and forms demo pages work fine.
- **Integration tests** (`pnpm test:integration`): Skipped automatically when Athena env vars are absent — this is expected.

### Gotchas

- The library must be built (`pnpm build`) before the apps can consume it — the apps reference it via `file:../..`.  The `prepare` script runs `pnpm build` automatically during `pnpm install`.
- `pnpm-workspace.yaml` has `onlyBuiltDependencies: [unrs-resolver]` to allow non-interactive installs.
