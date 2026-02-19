# HTTP Adapters

HTTP adapters handle communication with backend APIs.

## Request Headers

All requests include standard headers:

```typescript
{
  'X-Company-Id': user.company_id,
  'X-Organization-Id': user.organization_id,
  'X-User-Id': user.user_id,
  'Content-Type': 'application/json'
}
```

## Endpoints

### Fetch Data

```
POST /api/fetch/data

Body: {
  table_name: "customers",
  conditions: [...],
  columns: [...]
}
```

### Insert Data

```
PUT /api/data/insert

Body: {
  table_name: "customers",
  insert_body: { name: "...", ... }
}
```

### Update Data

```
PUT /api/update/data

Body: {
  table_name: "customers",
  x_id: "customer_id",
  x_column: "123",
  update_body: { status: "..." }
}
```

### Delete Data

```
DELETE /api/data/delete

Body: {
  table_name: "customers",
  x_id: "customer_id",
  x_column: "123"
}
```

## Custom Adapters

Implement `HttpAdapter`:

```typescript
interface HttpAdapter {
  fetch(request: FetchRequest): Promise<FetchResponse>;
  insert(request: InsertRequest): Promise<InsertResponse>;
  update(request: UpdateRequest): Promise<UpdateResponse>;
  delete(request: DeleteRequest): Promise<DeleteResponse>;
}

class CustomAdapter implements HttpAdapter {
  async fetch(request) {
    const response = await fetch('/custom-api/fetch', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return response.json();
  }
  // ... implement other methods
}
```

## Error Responses

```typescript
{
  error: "Unauthorized",
  message: "User does not have permission to access this resource",
  statusCode: 403
}
```

## Response Transformation

Transform responses before use:

```typescript
import { createTransformAdapter } from '@/packages/resource-framework/adapters/transforms';

const adapter = createTransformAdapter({
  fetch: (response) => {
    // Transform fetch response
    return response.data.map(normalizeRecord);
  }
});
```

## Authentication

All requests are authenticated via:
- User context (from session)
- Organization context
- Company context

Ensure proper scopes are set before making requests.

## See Also

- [Data API](./07-data-api.md)
- [Hooks](./05-hooks.md)
