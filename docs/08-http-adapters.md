# Athena Adapters

All framework data and managed-file operations cross the Athena SDK boundary in `adapters/`.

## Data

- `fetchDataViaAthena`
- `insertDataViaAthena`
- `updateDataViaAthena`
- `deleteDataViaAthena`

The adapters create a browser client with `createAthenaBrowserClient`, pass request and idempotency metadata through SDK options, and normalize write values to Athena JSON.

```ts
const result = await fetchDataViaAthena({
  table_name: "customers",
  schema: "public",
  columns: ["customer_id", "name"],
  limit: 25,
});
```

## Managed Storage

`uploadFileViaAthena` uses `client.storage.file.upload`. `refreshFileUrlViaAthena` resolves a managed file and calls `client.storage.file.proxyUrl`.

```ts
const uploaded = await uploadFileViaAthena({
  s3_id: storageCatalogId,
  files: file,
  resource_id: customerId,
  organization_id: organizationId,
});

const preview = await refreshFileUrlViaAthena({
  fileId: uploaded.files[0].id,
  purpose: "preview",
});
```

Provider credentials and legacy application upload routes are intentionally not part of this browser API.

## Configuration

Adapter configuration accepts `baseUrl`, `apiKey`, `client`, scoped headers, and `s3Id`. Applications should prefer restricted session-derived credentials. Privileged credentials must remain server-side.
