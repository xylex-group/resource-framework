# @xylex-group/resource-framework

Metadata-driven resource tables, drilldowns, forms, and managed file workflows built on Athena and Athena Auth UI.

## Runtime stack

- `@xylex-group/athena` for browser-safe data and managed storage operations.
- `@xylex-group/athena-auth-ui` and HeroUI for responsive tables and controls.
- Athena table models for schema metadata and derived TypeScript row/column types.
- React 19 and Next.js 16 in the included demo applications.

The package does not connect to a database directly. Consumers provide Athena gateway configuration and authenticated session context at their application boundary.

## Install

```bash
pnpm add @xylex-group/resource-framework @xylex-group/athena @xylex-group/athena-auth-ui @heroui/react
```

Import the Auth UI stylesheet once in the application root:

```ts
import "@xylex-group/athena-auth-ui/styles";
```

## Configuration

The demo applications use these public-scoped values:

```env
NEXT_PUBLIC_ATHENA_URL=https://athena-db.example.com
NEXT_PUBLIC_ATHENA_API_KEY=athena_public_dummy_key
NEXT_PUBLIC_ATHENA_CLIENT=example_client
NEXT_PUBLIC_ATHENA_STORAGE_S3_ID=s3_catalog_dummy_id
```

Only browser-safe, restricted credentials belong in `NEXT_PUBLIC_*` variables. Privileged credentials must stay behind a server or session bridge.

## Athena models

Models are authored with Athena's table DSL and exported from `athena/models/resource-models.ts`:

```ts
import { string, table } from "@xylex-group/athena";

export const contactsModel = table("contacts")
  .schema("public")
  .columns({
    contact_id: string().generated(),
    name: string(),
  })
  .primaryKey("contact_id");
```

Route and column types derive from these model values:

```ts
import {
  defineAthenaColumns,
  defineAthenaResourceRoute,
} from "@xylex-group/resource-framework";

export const contactsRoute = defineAthenaResourceRoute("contacts", {
  table: "contacts",
  idColumn: "contact_id",
  columns: defineAthenaColumns<"contacts">([
    { column_name: "contact_id", hidden: true },
    { column_name: "name" },
  ]),
});
```

## Data adapters

```ts
import {
  fetchDataViaAthena,
  insertDataViaAthena,
  updateDataViaAthena,
  deleteDataViaAthena,
} from "@xylex-group/resource-framework/adapters";
```

Adapters use `createAthenaBrowserClient` and structured Athena query chains. Values are normalized to Athena JSON at the adapter boundary.

## Managed files

`uploadFileViaAthena` and `refreshFileUrlViaAthena` use the Athena managed-storage facade. Uploads require a storage catalog ID (`s3_id`); previews and downloads use a proxy URL resolved from the managed file ID. Browser-side provider credentials and legacy multipart API routes are not supported.

## Tables

`ResourceTable`, table widgets, and `AthenaResourceTable` render through the shared Athena Auth UI `AthenaTable`. The bridge retains existing resource column renderers while using HeroUI loading skeletons, responsive mobile cards, search, sorting, and controls.

## Commands

```bash
pnpm build
pnpm lint
pnpm test
pnpm typecheck
pnpm test:integration
```

Integration tests skip when Athena environment values are absent.

## Workspace

- `adapters/`: Athena query and managed-storage adapters.
- `athena/`: typed Athena models and metadata helpers.
- `components/`: resource tables, forms, drilldowns, and widgets.
- `constructors/`: typed resource route and column builders.
- `apps/demo/`: full component demo on port 3000.
- `apps/playground-next/`: focused Athena playground on port 3001.
