# Formatting

Data formatting and display helpers.

## Format Module

```typescript
import {
  format as formatValue,
  formatPhone,
  formatEmail,
  formatCurrency,
  formatPercent
} from '@/packages/resource-framework/utils/format';
```

## Phone Number

```typescript
formatPhone('5551234567');        // '(555) 123-4567'
formatPhone('+15551234567');      // '+1 555-123-4567'
formatPhone('5551234567', 'intl'); // International format
```

## Email

```typescript
const email = 'john.doe@example.com';
formatEmail(email);               // 'john.doe@...'
formatEmail(email, { full: true }); // Full address
```

## Currency

```typescript
formatCurrency(1234.56);          // '$1,234.56'
formatCurrency(1234.56, 'EUR');   // '€1.234,56'
formatCurrency(1234.56, 'GBP');   // '£1,234.56'
```

## Percent

```typescript
formatPercent(0.95);              // '95%'
formatPercent(0.12345, 2);        // '12.35%' (2 decimals)
```

## File Size

```typescript
import { formatFileSize } from '@/packages/resource-framework/utils/format';

formatFileSize(1024);             // '1 KB'
formatFileSize(1048576);          // '1 MB'
formatFileSize(1073741824);       // '1 GB'
```

## Custom Formatter

```typescript
import { createFormatter } from '@/packages/resource-framework/utils/format';

const customFormatter = createFormatter({
  type: 'custom',
  pattern: (value) => `ID: ${value}`
});

customFormatter(123);  // 'ID: 123'
```

## Column Formatters

```typescript
{
  column_name: 'amount',
  formatter: (value) => formatCurrency(value),
  data_type: 'number'
}
```

## Conditional Formatting

```typescript
{
  column_name: 'status',
  formatter: (value) => {
    if (value === 'active') return <Badge>Active</Badge>;
    if (value === 'pending') return <Badge variant="warning">Pending</Badge>;
    return <Badge variant="error">Inactive</Badge>;
  }
}
```

## Display Options

```typescript
// Truncate long values
formatValue(longText, { truncate: 50 });

// Mask sensitive data
formatValue(email, { mask: true });

// Custom delimiter
formatValue(list, { delimiter: ' | ' });
```

## Locale Support

```typescript
const formatter = createFormatter({
  locale: 'en-US',
  timeZone: 'America/New_York'
});

formatter(new Date()); // Formatted for locale
```

## See Also

- [Utilities](./26-utilities.md)
- [Columns](./09-columns.md)
