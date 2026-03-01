# Best Practices

Guidelines for using the Resource Framework effectively.

## Configuration Best Practices

1. **Use Enums for Fixed Values**
```typescript
enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// Don't: hardcode strings
// Do: use enums
```

2. **Template Everything Dynamic**
```typescript
// Good: uses templates
objectPath: 'customers/{{resource_id}}/files'

// Avoid: hardcoded values
objectPath: 'customers/123/files'
```

3. **Provide Meaningful Labels**
```typescript
{
  column_name: 'created_at',
  header: 'Date Created',
  header_label: 'When the record was created'
}
```

## Component Best Practices

1. **Memoize Callbacks**
```typescript
const handleSort = useCallback((column) => {
  setSorting([{ id: column, desc: false }]);
}, []);
```

2. **Use Error Boundaries**
```typescript
<ErrorBoundary>
  <ResourceDrilldown />
</ErrorBoundary>
```

3. **Implement Loading States**
```typescript
if (isLoading) return <Skeleton />;
if (error) return <ErrorState />;
return <Content />;
```

## Performance Best Practices

1. **Paginate Large Datasets**
```typescript
const { data } = useApiClient({
  table: 'customers',
  limit: 50,
  offset: pageIndex * 50
});
```

2. **Cache Appropriately**
```typescript
// Enable caching for reads
const { data } = useApiClient({ table: 'customers' });

// Disable for real-time data
const { data } = useApiClient({
  table: 'live_data',
  cache_enabled: false
});
```

3. **Lazy Load Images**
```typescript
<img src={url} loading="lazy" />
```

## Type Safety Best Practices

1. **Use Strict TypeScript**
```json
{
  "compilerOptions": { "strict": true }
}
```

2. **Type API Responses**
```typescript
interface Customer {
  customer_id: string;
  name: string;
  email: string;
}

const { data } = useApiClient<Customer>({
  table: 'customers'
});
```

## Security Best Practices

1. **Whitelist Env Variables**
```typescript
const context = {
  allowedEnvVars: ['S3_BUCKET', 'API_URL'],
  entity
};
```

2. **Validate Input**
```typescript
const validValue = validateInput(value, rules);
```

3. **Use HTTPS**
```typescript
// Always use HTTPS for API calls
const url = 'https://api.example.com/data';
```

## Testing Best Practices

1. **Test Edge Cases**
```typescript
it('handles empty data', () => {
  const result = resolveTemplate('{{data}}', {});
  expect(result).toBe('');
});
```

2. **Mock External Calls**
```typescript
vi.mock('@xylex-group/athena');
```

3. **Test Error States**
```typescript
it('handles API errors', async () => {
  vi.mocked(executeDataApi).mockRejectedValue(new Error('API Error'));
  // Test error handling
});
```

## Code Organization

1. **Group Related Code**
```
/resources
  /customers
    route.ts
    drilldown.ts
    components.tsx
```

2. **Use Constructors**
```typescript
const route = defineResourceRoute({...});
const columns = defineColumns([...]);
```

3. **Separate Concerns**
```
- Routes: configuration
- Hooks: logic
- Components: UI
- Utils: helpers
```

## Documentation

1. **Document Custom Widgets**
```typescript
/**
 * Custom widget for displaying metrics.
 * @param spec - Widget specification
 * @param entity - Entity data
 */
export function MetricsWidget({ spec, entity }) {
  // ...
}
```

2. **Comment Complex Logic**
```typescript
// Calculate offset for pagination
const offset = pageIndex * pageSize;
```

## Common Pitfalls to Avoid

1. **Don't fetch on every render**
   - Use hooks to manage data fetching
   - Memoize to prevent re-renders

2. **Don't hardcode values**
   - Use templates
   - Use configuration

3. **Don't ignore errors**
   - Add error boundaries
   - Handle API errors

4. **Don't skip validation**
   - Validate inputs
   - Type check

## See Also

- [Architecture](./01-architecture.md)
- [Performance](./24-performance.md)
- [Security](./18-permissions.md)
