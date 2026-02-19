import type { WidgetConfig } from "./types";

export const ALL_WIDGETS: WidgetConfig[] = [
  {
    id: "sample-kpi-widget",
    kind: "kpi",
    title: "Customer KPIs",
    description: "Key customer metrics and insights",
    details: {
      summary: "Customer-focused KPIs including new customers, retention, and lifetime value.",
      notes: [
        "This widget tracks key customer metrics.",
        "Use it to monitor customer growth and engagement.",
      ],
      sections: [
        { id: "overview", title: "Overview", kind: "custom" },
        { id: "notes", title: "Notes", kind: "notes" },
      ],
    },
    kpiItems: [
      {
        label: "New customers",
        value: "184",
        change: "+2.1%",
        trend: "up",
        hint: "Compared to previous period",
            },
            {
        label: "Total customers",
        value: "1,245",
        change: "+5.4%",
        trend: "up",
        hint: "Compared to previous period",
      },
      {
        label: "Average invoice value  per customer",
        value: "$1,230",
        change: "-0.5%",
        trend: "down",
        hint: "Compared to previous period",
      },
      {
        label: "Top customer by invoice volume",
        value: "Acme Corp",
        trend: "neutral",
        hint: "Compared to previous period",
      },
    ],
    moreDetailsLink: "/widgets/sample-kpi-widget",
    enableMoreDetails: true,
    category: "customers",
    noDataMessage: "No data available",
    updatedText: "Updated just now",
  },
  {
    id: "invoices-total-daily",
    title: "Total invoice volume",
    description: "Total value of all invoices created in the selected period",
    details: {
      summary:
        "Tracks total invoice volume for the selected period, including issued invoices before payment.",
      notes: [
        "Includes all invoices created within the selected date range.",
        "Totals may lag slightly depending on data refresh timing.",
      ],
      sections: [
        { id: "overview", title: "Overview", kind: "custom" },
        { id: "notes", title: "Notes", kind: "notes" },
        { id: "trend", title: "Trend", kind: "trend" },
        { id: "breakdown", title: "Breakdown", kind: "breakdown" },
      ],
    },
    moreDetailsLink: "/widgets/invoices-total-daily",
    enableMoreDetails: true,
    isSQLWidget: true,
    hasChart: true,
    queryId: "57bbcd12-c33f-41e2-9719-00734cc33634",
    category: "revenue",
  },
  {
    id: "invoices-pending-volume",
    title: "Pending invoice volume",
    description: "Total value of invoices awaiting payment",
    details: {
      summary:
        "Shows open invoice value that is still outstanding and awaiting payment.",
      notes: [
        "Counts invoices that are open and awaiting payment.",
        "Excludes invoices marked as paid or cancelled.",
      ],
      sections: [
        { id: "overview", title: "Overview", kind: "custom" },
        { id: "notes", title: "Notes", kind: "notes" },
        { id: "trend", title: "Trend", kind: "trend" },
        { id: "breakdown", title: "Breakdown", kind: "breakdown" },
      ],
    },
    moreDetailsLink: "/widgets/invoices-pending-volume",
    enableMoreDetails: true,
    isSQLWidget: true,
    hasChart: true,
    queryId: "eed1e6b8-5095-43e3-a4fb-dc5601aee2a9",
    category: "revenue",
  },
  {
    id: "invoices-status-breakdown",
    title: "Invoice status breakdown",
    description: "Overview of invoices by status",
    details: {
      summary: "Distribution of invoice statuses across your organization.",
      notes: [
        "Status counts are aggregated for the selected date range.",
        "Updates with dashboard date and frequency filters.",
      ],
      sections: [
        { id: "overview", title: "Overview", kind: "custom" },
        { id: "notes", title: "Notes", kind: "notes" },
        { id: "breakdown", title: "Breakdown", kind: "breakdown" },
      ],
    },
    moreDetailsLink: "/widgets/invoices-status-breakdown",
    enableMoreDetails: true,
    isSQLWidget: true,
    hasStatusBreakdown: true,
    queryId: "fc991363-22b7-4a16-967f-060a2f37e25a",
    category: "payments",
    noDataMessage: "No invoice data",
  },
];

export const DEFAULT_VISIBLE_WIDGETS = [
  "sample-kpi-widget",
  "invoices-total-daily",
  "invoices-pending-volume",
  "invoices-status-breakdown",
];

export function getWidgetById(id: string): WidgetConfig | undefined {
  return ALL_WIDGETS.find((w) => w.id === id);
}

export function getWidgetsByCategory(
  category: WidgetConfig["category"],
): WidgetConfig[] {
  return ALL_WIDGETS.filter((w) => w.category === category);
}

export function getAvailableWidgets(visibleIds: string[]): WidgetConfig[] {
  return ALL_WIDGETS.filter(
    (w) => !visibleIds.includes(w.id) && w.kind !== "kpi",
  );
}

export function groupWidgetsByCategory(widgets: WidgetConfig[]) {
  return {
    payments: widgets.filter((w) => w.category === "payments"),
    revenue: widgets.filter((w) => w.category === "revenue"),
    customers: widgets.filter((w) => w.category === "customers"),
  };
}
