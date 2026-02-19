export type WidgetCategory = "payments" | "customers" | "revenue";
export type WidgetKind = "standard" | "kpi";
export type KpiTrend = "up" | "down" | "neutral";

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface ListItem {
  label: string;
  value: string;
}

export interface StatusDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface KpiItem {
  label: string;
  value?: string | number | null;
  change?: string;
  trend?: KpiTrend;
  hint?: string;
}

export type WidgetDetailsSectionKind =
  | "notes"
  | "trend"
  | "breakdown"
  | "table"
  | "custom";

export interface WidgetDetailsSection {
  id: string;
  title: string;
  description?: string;
  kind?: WidgetDetailsSectionKind;
}

export interface WidgetDetailsConfig {
  summary?: string;
  notes?: string[];
  sections?: WidgetDetailsSection[];
}

export interface WidgetConfig {
  id: string;
  title: string;
  kind?: WidgetKind;
  description?: string;
  details?: WidgetDetailsConfig;
  value?: string;
  previousValue?: string;
  hasChart?: boolean;
  chartData?: ChartDataPoint[];
  hasStatusBreakdown?: boolean;
  statusBreakdownData?: StatusDataPoint[];
  hasExploreButton?: boolean;
  noDataMessage?: string;
  allTimeLabel?: boolean;
  updatedText?: string;
  moreDetailsLink?: string;
  enableMoreDetails?: boolean;
  hasScroll?: boolean;
  listData?: ListItem[];
  kpiItems?: KpiItem[];
  category: WidgetCategory;
  queryId?: string;
  isSQLWidget?: boolean;
  queryName?: string;
  ignoresDateRange?: boolean;
}

export interface WidgetProps {
  config: WidgetConfig;
  isEditMode?: boolean;
  onRemove?: () => void;
}
