# Performance

Performance optimization strategies.

## Memoization

```typescript
import { useMemo, useCallback } from 'react';

function ResourceTable({ data, filters }) {
  // Memoize expensive computations
  const filteredData = useMemo(() => {
    return applyFilters(data, filters);
  }, [data, filters]);

  // Memoize callbacks
  const handleSort = useCallback((column) => {
    setSort({ ...sort, column });
  }, [sort]);

  return <Table data={filteredData} />;
}
```

## Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const ResourceDrilldown = lazy(() =>
  import('@/packages/resource-framework/components/ResourceDrilldown')
);

function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResourceDrilldown resourceId="1" />
    </Suspense>
  );
}
```

## Virtualization

```typescript
import { FixedSizeList } from 'react-window';

function LargeTable({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={35}
    >
      {Row}
    </FixedSizeList>
  );
}
```

## Pagination

Fetch data in pages:

```typescript
const { data } = useApiClient({
  table: 'customers',
  limit: 50,
  offset: pageIndex * 50
});
```

## Caching

Data caching enabled by default:

```typescript
// Disable caching for specific requests
const { data } = useApiClient({
  table: 'customers',
  cache_enabled: false
});
```

## Debouncing

```typescript
import { useDebounce } from '@/packages/resource-framework/hooks/use-debounce';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery]);
}
```

## Batch Updates

```typescript
// Update multiple resources in one request
const results = await Promise.all([
  updateCustomer(id1, data1),
  updateCustomer(id2, data2),
  updateCustomer(id3, data3)
]);
```

## Lazy Loading

```typescript
function DrilldownWithLazyLoad() {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    // Load sections on demand
    loadSection('basic').then(s => setSections(s));
  }, [resourceId]);
}
```

## Image Optimization

```typescript
<img
  src={url}
  loading="lazy"
  alt="description"
  width={100}
  height={100}
/>
```

## Bundle Size

```typescript
// Import specific modules
import { resolveTemplate } from '@/packages/resource-framework/templating/resolver';

// Not: import * from '@/packages/resource-framework/templating';
```

## See Also

- [Architecture](./01-architecture.md)
- [Hooks](./05-hooks.md)
