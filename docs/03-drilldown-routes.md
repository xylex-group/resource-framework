# Drilldown Routes

Drilldown routes define the detailed view of a single resource.

## Basic Structure

```typescript
export const RESOURCE_DRILLDOWN_ROUTES: ResourceDrilldownRegistry = {
  customers: {
    title: (row) => `Customer: ${row.name}`,
    backLabel: (resourceName) => `Back to ${resourceName}`,
    sections: [
      {
        title: 'General Information',
        columns: 2,
        fields: ['name', 'email', 'phone', 'status']
      },
      {
        title: 'Related Invoices',
        widgets: [
          {
            type: 'table',
            props: {
              resourceName: 'invoices',
              conditions: [
                { eq_column: 'customer_id', eq_value: '{{resource_id}}' }
              ]
            }
          }
        ]
      }
    ]
  }
};
```

## Sections

```typescript
{
  title: 'Section Title',
  columns: 2,                    // Layout: 1, 2, 3, or 4
  fields: [
    'field_name',               // Simple field
    {
      key: 'complex_field',
      label: 'Custom Label',
      hidden: false,
      field_type: 'text'       // Display type
    }
  ],
  widgets: [/* widget definitions */],
  expose_to_edit_state: true   // Show in edit form
}
```

## Widgets

```typescript
{
  title: 'Files',
  columns: 1,
  fields: [],
  widgets: [
    {
      type: 'file_explorer',
      props: {
        table: 'files',
        conditions: [
          { eq_column: 'customer_id', eq_value: '{{resource_id}}' },
          { eq_column: 'organization_id', eq_value: '{{user.organization_id}}' }
        ],
        objectPath: 'customers/{{resource_id}}'
      }
    }
  ]
}
```

## Actions

```typescript
actions: [
  {
    label: 'Edit',
    onClick: () => setEditMode(true)
  },
  {
    label: 'Delete',
    onClick: async () => {
      await deleteResource();
      navigate(-1);
    },
    destructive: true
  }
]
```

## Template Support

Use `{{…}}` tokens in:
- `title(row)` functions
- Widget conditions
- Widget object paths

Available prefixes:
- `{{resource_id}}` - Resource ID
- `{{user.organization_id}}` - User data
- `{{field_name}}` - Direct field access

## See Also

- [Templates](./31-templating-system.md)
- [Widgets](./04-widgets.md)
- [Sections](./11-sections.md)
