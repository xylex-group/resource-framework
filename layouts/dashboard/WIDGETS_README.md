suitsbooks-new\components\dashboard\WIDGETS_README.md
# Dashboard Widgets - Quick Start

## Overview

The widget dashboard is a customizable overview page displaying key business metrics through interactive widgets. Widgets are powered by SQL queries executed via the Athena database API, providing real-time data visualization with charts, status breakdowns, and configurable date ranges.

## Key Features

- **Customizable Layout**: Add, remove, and reorder widgets in edit mode
- **Date Range Filtering**: Select from predefined ranges (Today, Last 7 days, Last 4 weeks, etc.) with automatic frequency adjustment
- **Data Aggregation**: Choose frequency (Hourly, Daily, Weekly, Monthly) based on selected date range
- **Batch Querying**: Efficiently fetches data for all visible widgets in a single API call
- **Persistent Configuration**: Dashboard settings are automatically saved and restored
- **Responsive Design**: Adapts to different screen sizes with dynamic grid layout
- **Real-time Updates**: Widgets refresh data based on selected parameters

## SQL Widgets

Widgets are backed by rows in the `sql_queries` table and executed via the Athena DB API.

1. **Create a SQL query** - Insert a row in `sql_queries` with:
   - `query` (SQL text)
   - `variables` (JSON array of variable names)
   - `data_type` (e.g. `currency`, `number`, `percentage`)
   - `decimals` (optional)

   Example query:

   ```sql
   SELECT
     DATE(created_at) AS day,
     SUM(amount) AS total_amount
   FROM invoices
   WHERE organization_id = $1
     AND amount > 0
   GROUP BY day
   ORDER BY day;
   ```

2. **Add to registry** - Add the `queryId` from `sql_queries` into [widgets/registry.ts](widgets/registry.ts):

   ```typescript
   {
     id: "widget-id",
     title: "Widget Title",
     value: "—",
     isSQLWidget: true,
     queryId: "<sql_queries.query_id>",
     category: "revenue",
   }
   ```

3. **(Optional) Make default** - Add the widget ID to `DEFAULT_VISIBLE_WIDGETS` in [widgets/registry.ts](widgets/registry.ts).

## Widget Types

- **Chart Widgets**: Display time-series data with area/bar/line charts
- **Status Breakdown Widgets**: Show categorical data distribution (e.g., invoice statuses)
- **Metric Widgets**: Display single values with optional previous period comparison

## Variables

Widget variables are resolved in [app/api/dashboard/widget-query/route.ts](../../app/api/dashboard/widget-query/route.ts):

- `organization_id` → `activeOrganizationId` from session
- `user_id` → `session.user.id`
- `owner_id` → `organization_id` (fallback to `user_id` if org is null)

Use `$1`, `$2`, ... in SQL, matching the order in `variables`.

## Athena Integration

Queries are executed through the Athena DB API, which provides:
- Secure database access via API gateway
- Connection pooling and query optimization
- Support for parameterized queries
- Error handling and response formatting

The Athena client is configured in `lib/config.ts` with:
- `db_api_url`: API endpoint for query execution
- `standard_client`: Client identifier for connection routing

## Data Source Notes

- The `invoices` table stores `amount`, `total`, and `total_incl_vat`.
- If your widget uses `SUM(amount)` and shows 0, ensure `invoices.amount` is populated for that organization.
- If your data uses a different total field, update the SQL in `sql_queries` accordingly.

## API Endpoints

### Frontend

```typescript
// Fetch dashboard config
const config = await fetch("/api/dashboard/config").then((r) => r.json());
// Returns: { cardOrder: string[], cardSettings: object }

// Save dashboard config
await fetch("/api/dashboard/config", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    cardOrder: ["payments", "revenue"],
    cardSettings: {},
  }),
});

// Batch fetch widget data
await fetch("/api/dashboard/widgets", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    widgets: [{
      queryId: "query-id",
      dateRange: "Last 7 days",
      frequency: "Daily",
      compareEnabled: false,
      comparePeriod: "Previous period"
    }]
  }),
});
```

### Backend Endpoints

```
GET /api/dashboard/config
Response: { cardOrder: string[], cardSettings: object }

POST /api/dashboard/config
Body: { cardOrder: string[], cardSettings: object }
Response: { success: boolean }

POST /api/dashboard/widgets
Body: { widgets: WidgetQuery[] }
Response: { results: Record<string, WidgetResult> }
```
