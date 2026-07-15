# ResourceProvider

`ResourceProvider` loads user preferences, permission scopes, notifications,
and legacy feature flags for resource components. Resource data itself is
loaded by `ResourceTable`, `ResourceDrilldown`, or `useApiClient`.

## Basic Usage

```tsx
import { ResourceProvider } from "@xylex-group/resource-framework";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ResourceProvider>{children}</ResourceProvider>;
}
```

## Props

- `children`: child components.
- `cacheEnabled`: prevents repeated context fetches after the first successful load. Defaults to `true`.

## Context Values

The exported `ResourceContext` contains:

- `userPreferences`
- `userScopes`
- `notifications`
- `flags` (deprecated)
- `hasScope(scope)`
- `hasFlag(flag)` (deprecated)
- `isLoading`
- `refetch()`

Resource identity, edit state, related records, and mutation errors are not
provider responsibilities. Use the resource components and Athena hooks for
those concerns.

## See Also

- [Hooks](./05-hooks.md)
- [Components](./06-components.md)
- [Permissions](./18-permissions.md)
