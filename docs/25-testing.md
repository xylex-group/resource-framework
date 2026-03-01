# Testing

Testing resource framework code.

## Unit Testing

```typescript
import { describe, it, expect } from 'vitest';
import { defineColumns } from '@/packages/resource-framework/constructors/define-columns';

describe('defineColumns', () => {
  it('creates column definitions', () => {
    const columns = defineColumns([
      { column_name: 'id', hidden: true },
      { column_name: 'name', header: 'Name' }
    ]);

    expect(columns).toHaveLength(2);
    expect(columns[0].hidden).toBe(true);
  });
});
```

## Template Testing

```typescript
import { resolveTemplate } from '@/packages/resource-framework/templating';

describe('Template Resolution', () => {
  it('resolves user prefix', () => {
    const result = resolveTemplate('{{user.name}}', {
      user: { name: 'John' }
    });
    expect(result).toBe('John');
  });

  it('resolves resource_id', () => {
    const result = resolveTemplate('{{resource_id}}', {
      entity: { customer_id: '123' },
      idColumn: 'customer_id'
    });
    expect(result).toBe('123');
  });
});
```

## Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useResourceRoute } from '@/packages/resource-framework/hooks/useResourceRoute';

describe('useResourceRoute', () => {
  it('returns resource route', () => {
    const { result } = renderHook(() => useResourceRoute('customers'));
    expect(result.current).toBeDefined();
    expect(result.current.table).toBe('customers');
  });
});
```

## Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ResourceTable } from '@/packages/resource-framework/components/ResourceTable';

describe('ResourceTable', () => {
  it('renders table', () => {
    render(<ResourceTable resourceName="customers" />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
```

## Mock API Calls

```typescript
import { vi } from 'vitest';

vi.mock('@xylex-group/athena', () => ({
  Backend: { Athena: { type: 'athena' } },
  createClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}));

// Now Athena-backed adapters can be tested without a live gateway
```

## Adapter Contract Tests

Use contract tests for the Athena adapter boundary:

```typescript
import { fetchDataViaAthena } from '@/packages/resource-framework/adapters';

it('maps framework fetch requests onto Athena', async () => {
  const result = await fetchDataViaAthena({
    table_name: 'customers',
    conditions: [{ eq_column: 'organization_id', eq_value: 'org-1' }],
  });

  expect(result.error).toBeNull();
});
```

## Test Fixtures

```typescript
// tests/fixtures.ts
export const mockCustomer = {
  customer_id: '1',
  name: 'Acme Corp',
  email: 'contact@acme.com',
  status: 'active'
};

export const mockRoute = {
  table: 'customers',
  idColumn: 'customer_id',
  columns: ['customer_id', 'name', 'email', 'status']
};
```

## Integration Testing

Run the real Athena environment suite with:

```bash
npm run test:integration
```

The runner validates the required `ATHENA_INTEGRATION_*` variables before invoking `vitest` and applies a timeout via `ATHENA_INTEGRATION_TIMEOUT_MS` (defaults to `180000`).

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { ResourceProvider } from '@/packages/resource-framework/components/ResourceProvider';

describe('Integration', () => {
  it('loads and displays resource', async () => {
    render(
      <ResourceProvider resourceName="customers" resourceId="1">
        <ResourceDrilldown />
      </ResourceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });
});
```

## Coverage

```bash
# Run tests with coverage
npm test -- --coverage

# Run workspace typechecks
npm run typecheck

# Required coverage:
# Statements: 80%
# Branches: 80%
# Functions: 80%
# Lines: 80%
```

## See Also

- [Templating](./31-templating-system.md)
- [Type Safety](./23-type-safety.md)
