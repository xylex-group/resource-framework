# Copilot Instructions for Resource Framework

## Project overview

`resource-framework` is a TypeScript/React library that turns a Drizzle ORM schema into a fully-functional, type-safe admin interface. It ships both React UI primitives (`ResourceTable`, `ResourceDrilldown`, `CreateResourceDialog`) and non-UI helpers (adapters, hooks, utilities) so consuming apps can build resource pages without duplicating infrastructure.

The package is published as an ESM/CJS dual-build via Rollup and exposes three entry points: `.` (root), `./components`, and `./adapters`.

## Repository layout

| Directory / file | Purpose |
|---|---|
| `adapters/` | Low-level network wrappers (`drizzleInsertMany`, `withRetry`, `applyTransform`) |
| `components/` | React UI: `ResourceTable`, `ResourceDrilldown`, `CreateResourceDialog`, table controls, form stack, edit-state helpers, drilldown sections |
| `constructors/` | Column builders (`column-registry`, `define-columns`) and route validator (`define-drizzle-resource-route`) |
| `handlers/` | Mutation and CSV-export handlers that call the adapters |
| `hooks/` | All exported React hooks (`useResourceContext`, `useFetchData`, `useUpdateData`, `useTableConfiguration`, etc.) |
| `layouts/` | Shared layout wrappers used by drilldown and table pages |
| `lightbox/` | Lightbox component for media previews |
| `notifications/` | Notification primitives consumed by `useNotification` |
| `registries/` | `RESOURCE_ROUTES`, `RESOURCE_DRILLDOWN_ROUTES`, and `filter-registry` |
| `renderers/` | Specialised cell renderers (e.g. `VideoRenderer`) |
| `templating/` | Token-replacement helpers used by masked-link columns |
| `types/` | Generated typings (`drizzle-schema.ts`) and TanStack Table declarations |
| `utils/` | Pure helpers: coercion, CSV, dork-query parsing, Drizzle metadata, client-side filtering, key-case normalisation |
| `resource-types.ts` | All shared config shapes (`ResourceRoute`, `ResourceFieldSpec`, `ColumnConfig`, etc.) |
| `index.ts` | Public re-export barrel |
| `__tests__/` | Vitest unit tests |

## Tech stack

- **Language**: TypeScript (strict mode, ESNext modules, `moduleResolution: Bundler`)
- **Framework**: React 18+ (JSX transform via `react-jsx`)
- **Table**: TanStack Table v8
- **ORM**: Drizzle ORM (metadata consumed from `meta/snapshot.json` at runtime)
- **Build**: Rollup + `rollup-plugin-dts` + `tsc -p tsconfig.build.json`
- **Tests**: Vitest (`vitest run`)
- **Monorepo tooling**: Turborepo (`turbo run build/dev`)

## Development workflow

```bash
# Install dependencies
npm install

# Build the library (outputs to dist/)
npm run build

# Type-check without emitting
npm run typecheck

# Run all tests once
npm test

# Watch mode
npm run test:watch
```

> After any change to `drizzle/schema.ts` in a consuming app, regenerate the metadata snapshot with `npx drizzle-kit generate`. The `types/drizzle-schema.ts` file must be kept in sync with the snapshot.

## Coding conventions

### TypeScript
- Strict mode is enforced. Avoid `any`; prefer `unknown` with narrowing.
- Use `import type` for type-only imports.
- Paths are resolved from the repo root using the `@/` alias (see `tsconfig.json` `baseUrl: "."`).

### Exports
- All public API is re-exported from `index.ts`.
- When adding a new exportable symbol, add it to `index.ts` **and** the relevant `components/index.ts` or `adapters/index.ts` barrel if it belongs to a sub-entry-point.

### Resource routes
- Register new resources in `registries/resource-routes.ts` (`RESOURCE_ROUTES`).
- Use `defineDrizzleResourceRoute` and `defineDrizzleColumns` for type safety — never inline raw strings for table/column names.
- Optional drilldown overrides belong in `registries/resource-drilldown-routes.ts`.

### Components
- Wrap consumer pages in `ResourceProvider` to supply `ResourceContext`.
- Use `Table*` components (`TableAddButton`, `TableSearchInput`, etc.) for consistent styling.
- Always call `notification({ message, success })` via `useNotification` after mutations.
- Use `uuid` (not `row_id`) when building drilldown URLs.
- Register custom drilldown widgets via `registerSectionWidget` inside `components/sections/widgets`.

### Network / mutations
- All HTTP calls must go through `adapters/execute-data-api.ts` (`drizzleInsertMany`, `withRetry`).
- Updates use PUT to `{APP_CONFIG.api.suitsbooks}/update/data` with the required workspace headers.
- Handle caching via `Cache-Control` headers; routes may set `force_no_cache` to bypass caching.

### Styling
- No CSS files are bundled. Consumers supply their own Tailwind/CSS setup.
- Follow the icon/rounding/variant conventions used by existing `Table*` components.

## Testing

Unit tests live in `__tests__/`. Each test file covers a specific module:

| File | What it tests |
|---|---|
| `build-columns.test.tsx` | Column builder utilities |
| `coerce.test.ts` | Type coercion helpers |
| `define-columns.test.ts` | `defineColumns` constructor |
| `display-config.test.ts` | Display/visibility configuration |
| `key-case.test.ts` | Key-case normalisation helpers |
| `resource-drilldown-helpers.test.ts` | Drilldown section helpers |
| `string.test.ts` | String utilities |
| `templates.test.ts` | Token-replacement/templating |
| `use-table-configuration.test.ts` | `useTableConfiguration` hook |

When adding new logic:
1. Add tests in `__tests__/` that mirror the pattern of existing test files.
2. Use `describe` / `it` blocks with `expect` from Vitest.
3. Prefer `import type` in test files when only types are needed.
4. Run `npm test` to verify tests pass before opening a PR.

## Common pitfalls

- **Missing snapshot**: if columns aren't rendering or types are wrong, run `npx drizzle-kit generate` in the consuming app.
- **Type errors after schema change**: restart the TypeScript server and ensure tables are exported in `drizzle/schema.ts`.
- **Fields rendering as plain text**: explicitly set `data_type` and `editor.type` in the column config.
- **Imports from Drizzle on the client**: never import the Drizzle schema directly in client components — use `getDrizzleColumnInfo` / `getDrizzleFieldType` from `utils/drizzle-editor.ts` instead.
