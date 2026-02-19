# Templating System

Dynamic value resolution using templates.

## Overview

The templating system resolves `{{prefix.key}}` tokens in configuration using a strategy-based resolver.

## Strategies

### env Strategy

Access environment variables (server-side only):

```
{{env.MINIO_BUCKET}}
{{env.API_URL}}
```

### user Strategy

Access user properties:

```
{{user.organization_id}}
{{user.user_id}}
{{user.profile.name}}
```

### resource Strategy

Access resource/entity data:

```
{{resource.id}}           → idColumn value
{{resource_id}}           → shorthand for above
{{resource.customer_name}}  → entity field
```

### column Strategy

Access direct columns (fallback):

```
{{customer_id}}
{{status}}
```

## Basic Usage

```typescript
import { resolveTemplate } from '@/packages/resource-framework/templating';

const result = resolveTemplate(
  'customers/{{resource_id}}/files',
  {
    entity: { customer_id: '123' },
    idColumn: 'customer_id'
  }
);
// result = 'customers/123/files'
```

## Type Preservation

```typescript
import { resolveTemplateValue } from '@/packages/resource-framework/templating';

// Pure template preserves type
const count = resolveTemplateValue('{{count}}', {
  entity: { count: 42 }
});
// count = 42 (number)

// Mixed template returns string
const text = resolveTemplateValue('Total: {{count}}', {
  entity: { count: 42 }
});
// text = 'Total: 42' (string)
```

## Configuration Examples

```typescript
// Resource route
{
  drilldownHref: '/customers/{{resource_id}}',
  searchBy: 'name'
}

// Drilldown route
{
  title: (row) => `Customer: {{name}}`
}

// Widget
{
  type: 'file_explorer',
  props: {
    objectPath: 'rsf/{{user.organization_id}}/customers/{{resource_id}}',
    conditions: [
      { eq_column: 'customer_id', eq_value: '{{resource_id}}' }
    ]
  }
}
```

## Context

```typescript
interface TemplateContext {
  entity?: Record<string, unknown>;
  user?: Record<string, unknown>;
  idColumn?: string;
  columns?: string[];
  resourceName?: string;
  allowedEnvVars?: string[];
  custom?: Record<string, unknown>;
}
```

## Options

```typescript
interface TemplateOptions {
  preserveTypes?: boolean;
  defaultValue?: unknown;
  strict?: boolean;
  logWarnings?: boolean;
  coerce?: (value: unknown) => unknown;
}
```

## Custom Strategies

```typescript
import { registerStrategy } from '@/packages/resource-framework/templating';

class ConfigStrategy {
  resolve(key, context) {
    return config.get(key);
  }
}

registerStrategy('config', new ConfigStrategy());

// Use it
resolveTemplate('{{config.theme}}', {});
```

## See Also

- [Templating README](../templating/README.md)
- [File Explorer Widget](./20-file-explorer-widget.md)
