# Data API

The data API provides methods for CRUD operations on resources.

## Core Methods

### Fetch Data

```typescript
import { executeDataApi } from '@/packages/resource-framework/adapters/execute-data-api';

const data = await executeDataApi({
  method: 'GET',
  table_name: 'customers',
  conditions: [
    { eq_column: 'status', eq_value: 'active' }
  ]
});
```

### Insert Data

```typescript
const result = await executeDataApi({
  method: 'POST',
  table_name: 'customers',
  insert_body: {
    name: 'Acme Corp',
    email: 'contact@acme.com',
    status: 'active'
  }
});
```

### Update Data

```typescript
const result = await executeDataApi({
  method: 'PUT',
  table_name: 'customers',
  x_id: 'customer_id',
  x_column: '123',
  update_body: {
    status: 'inactive'
  }
});
```

### Delete Data

```typescript
const result = await executeDataApi({
  method: 'DELETE',
  table_name: 'customers',
  x_id: 'customer_id',
  x_column: '123'
});
```

## useApiClient Hook

Recommended way to manage data:

```typescript
const { data, isLoading, insert, remove } = useApiClient({
  table: 'customers',
  conditions: [{ eq_column: 'status', eq_value: 'active' }],
  columns: ['customer_id', 'name', 'email']
});

// Insert
await insert({ name: 'New Co', email: 'new@co.com' });

// Delete
await remove('customer_id', '123');
```

## Request Format

```typescript
{
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  table_name: string,
  
  // For fetches:
  conditions?: [
    { eq_column: string, eq_value: string | number | boolean | null }
  ],
  columns?: string[],
  
  // For updates:
  x_id?: string,           // column name
  x_column?: string,       // column value
  update_body?: object,
  
  // For inserts:
  insert_body?: object
}
```

## Response Format

```typescript
{
  data: {
    id?: string,
    records?: Array<Record<string, unknown>>,
    count?: number,
    // ... operation-specific fields
  },
  error?: string
}
```

## Error Handling

```typescript
try {
  const result = await executeDataApi({...});
  if (result.error) {
    console.error('API Error:', result.error);
  }
} catch (error) {
  console.error('Network Error:', error);
}
```

## Caching

Data is cached by default. Disable with:

```typescript
const { data } = useApiClient({
  table: 'customers',
  // Force fresh data:
  cache_enabled: false
});
```

## See Also

- [Hooks](./05-hooks.md)
- [HTTP Adapters](./09-http-adapters.md)
