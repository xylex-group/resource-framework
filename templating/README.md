# Resource Framework Template System

A unified, extensible template resolution system with strategy-based resolvers for handling dynamic values in resource configurations.

## Overview

The template system supports multiple prefixes for different data sources:
- `{{env.XXX}}` - Environment variables
- `{{user.XXX}}` - User properties
- `{{resource.XXX}}` or `{{resource_id}}` - Resource/entity data
- `{{column_name}}` - Direct column references (fallback)

## Quick Start

```typescript
import { resolveTemplate } from '@/packages/resource-framework/templating';

const result = resolveTemplate(
  "{{user.organization_id}}/{{resource_id}}/{{status}}",
  {
    user: { organization_id: "org-123" },
    entity: { customer_id: "cust-456", status: "active" },
    idColumn: "customer_id"
  }
);
// result = "org-123/cust-456/active"
```

## Architecture

```
templating/
├── index.ts                    # Main exports & initialization
├── types.ts                    # Type definitions
├── registry.ts                 # Strategy registry
├── resolver.ts                 # Core template resolver
├── strategies/
│   ├── env-strategy.ts         # {{env.XXX}}
│   ├── user-strategy.ts        # {{user.XXX}}
│   ├── resource-strategy.ts    # {{resource.XXX}} or {{resource_id}}
│   └── column-strategy.ts      # Direct column references
└── __tests__/
    └── templating.test.ts
```

## Strategies

### EnvStrategy

Resolves environment variables on the server-side only.

```typescript
// Server-side only
{{env.MINIO_BUCKET}}     // → process.env.MINIO_BUCKET
{{env.API_URL}}          // → process.env.API_URL
```

**Security**: Optionally provide `allowedEnvVars` in context to whitelist variables.

```typescript
const context = {
  allowedEnvVars: ['MINIO_BUCKET', 'API_URL']
};
```

### UserStrategy

Resolves user properties with case-insensitive lookup.

```typescript
{{user.organization_id}}       // → context.user.organization_id
{{user.organizationId}}        // → same (case-insensitive)
{{user.profile.name}}          // → nested access supported
```

### ResourceStrategy

Resolves resource/entity data with special handling for IDs.

```typescript
{{resource.id}}                // → context.entity[context.idColumn]
{{resource_id}}                // → shorthand for above
{{resource.customer_name}}     // → context.entity.customer_name
```

### ColumnStrategy

Fallback for unprefixed column names.

```typescript
{{customer_id}}                // → context.entity.customer_id
{{status}}                     // → context.entity.status
```

## API Reference

### resolveTemplate(template, context, options?)

Resolves all template tokens in a string.

**Parameters:**
- `template: string` - Template string with `{{tokens}}`
- `context: TemplateContext` - Data context
- `options?: TemplateOptions` - Optional configuration

**Returns:** `string`

**Example:**
```typescript
const result = resolveTemplate(
  "User {{user.name}} has {{count}} items",
  {
    user: { name: "John" },
    entity: { count: 5 }
  }
);
// result = "User John has 5 items"
```

### resolveTemplateValue(value, context, options?)

Resolves a template value with type preservation.

**Parameters:**
- `value: string | number | boolean | null | undefined` - Value to resolve
- `context: TemplateContext` - Data context
- `options?: TemplateOptions` - Optional configuration

**Returns:** `string | number | boolean | null | undefined`

**Example:**
```typescript
const count = resolveTemplateValue("{{count}}", { entity: { count: 42 } });
// count = 42 (number, not string)
```

## Type Definitions

### TemplateContext

```typescript
interface TemplateContext {
  entity?: Record<string, unknown>;        // Current entity/row
  user?: Record<string, unknown>;          // User data
  idColumn?: string;                       // ID column name
  columns?: string[];                      // Available columns
  resourceName?: string;                   // Resource name
  allowedEnvVars?: string[];              // Env var whitelist
  custom?: Record<string, unknown>;        // Custom data
}
```

### TemplateOptions

```typescript
interface TemplateOptions {
  preserveTypes?: boolean;      // Keep number/boolean types
  defaultValue?: unknown;       // Fallback for missing values
  strict?: boolean;             // Throw on resolution failures
  logWarnings?: boolean;        // Log unresolved templates
  coerce?: (value: unknown) => unknown;  // Custom coercion
}
```

## Usage Examples

### File Explorer Widget

```typescript
// In resource-drilldown-routes.ts
{
  type: "file_explorer",
  props: {
    conditions: [
      { eq_column: "customer_id", eq_value: "{{resource_id}}" },
      { eq_column: "organization_id", eq_value: "{{user.organization_id}}" }
    ],
    objectPath: "rsf/{{user.organization_id}}/customers/{{resource_id}}",
    bucket: "{{env.S3_BUCKET}}"  // Server-side only
  }
}
```

### Table Widget

```typescript
{
  type: "table",
  props: {
    resourceName: "invoices",
    conditions: [
      { eq_column: "customer_id", eq_value: "{{customer_id}}" },
      { eq_column: "status", eq_value: "{{status}}" }
    ]
  }
}
```

### Mixed Templates

```typescript
const path = resolveTemplate(
  "{{env.BASE_PATH}}/{{user.organization_id}}/{{resource.type}}/{{resource_id}}",
  {
    user: { organization_id: "org-123" },
    entity: { 
      customer_id: "cust-456",
      type: "standard"
    },
    idColumn: "customer_id",
    allowedEnvVars: ["BASE_PATH"]
  }
);
// path = "/api/org-123/standard/cust-456" (if BASE_PATH="/api")
```

## Type Coercion

The system automatically coerces types for pure templates:

```typescript
// Numbers
resolveTemplateValue("{{count}}", { entity: { count: "42" } })  // → 42

// Booleans
resolveTemplateValue("{{active}}", { entity: { active: "true" } })  // → true

// Null
resolveTemplateValue("{{empty}}", { entity: { empty: "" } })  // → null

// Mixed templates always return strings
resolveTemplateValue("Count: {{count}}", { entity: { count: 42 } })  // → "Count: 42"
```

## Migration Guide

### From old `resolveTemplateValue`

**Before:**
```typescript
import { resolveDrilldownPayloadValue } from "@/packages/resource-framework/utils/drilldown-template";

const value = resolveDrilldownPayloadValue(entity, "user.organization_id");
```

**After:**
```typescript
import { resolveTemplate } from "@/packages/resource-framework/templating";

const value = resolveTemplate("{{user.organization_id}}", {
  user,
  entity
});
```

### From old `interpolateWidgetValue`

**Before:**
```typescript
import { interpolateWidgetValue } from "@/packages/resource-framework/utils/widget-conditions";

const value = interpolateWidgetValue("{{customer_id}}", entity);
```

**After:**
```typescript
import { resolveTemplateValue } from "@/packages/resource-framework/templating";

const value = resolveTemplateValue("{{customer_id}}", {
  entity,
  user
});
```

## Extension

Add custom strategies by implementing the `TemplateStrategy` interface:

```typescript
import { registerStrategy, type TemplateStrategy, type TemplateContext } from '@/packages/resource-framework/templating';

class ConfigStrategy implements TemplateStrategy {
  resolve(key: string, context: TemplateContext): unknown {
    // Your custom resolution logic
    return myConfigService.get(key);
  }
}

// Register it
registerStrategy('config', new ConfigStrategy());

// Use it
resolveTemplate("{{config.theme}}", {});  // → uses ConfigStrategy
```

## Testing

The system includes comprehensive tests covering:
- All strategy types
- Type coercion
- Mixed templates
- Edge cases (null, undefined, empty strings)
- Security (env var whitelisting)

Run tests:
```bash
npm test packages/resource-framework/templating/__tests__/templating.test.ts
```

## Security Considerations

1. **Environment Variables**: Only accessible server-side. Use `allowedEnvVars` whitelist.
2. **User Data**: Ensure user context is properly sanitized.
3. **Column Access**: Optional `strictColumnCheck` for column validation.

## Performance

- Template parsing is cached per unique template string
- Case-insensitive lookups use optimized key-case utilities
- Strategy dispatch is O(1) via Map-based registry
