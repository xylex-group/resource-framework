"use client";

import { ChartContainer } from "../ui/chart";

export interface ChartDataPoint {
  [key: string]: unknown;
}

export interface LineBarChartWidgetProps {
  data?: ChartDataPoint[];
  chartType?: string;
  xDataKey?: string;
  yDataKey?: string;
  color?: string;
  colors?: string[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  dateFormat?: string;
  valueFormat?: string;
  aggregation?: string;
  sortBy?: string;
  sortOrder?: string;
  resourceId?: string;
  resourceIdColumn?: string;
  organizationId?: string;
  projectId?: string;
  objectPath?: string;
  bucket?: string;
}

export function AreaChartWidget() {
  return (
    <ChartContainer className="h-32">
      <p className="text-xs text-slate-400">Area chart placeholder</p>
    </ChartContainer>
  );
}

export function LineBarChartWidget(props: LineBarChartWidgetProps) {
  return (
    <ChartContainer
      className="h-32"
      config={{
        chartType: props.chartType,
        xDataKey: props.xDataKey,
        yDataKey: props.yDataKey,
        color: props.color,
        showGrid: props.showGrid,
      }}
    >
      <p className="text-xs text-slate-400">
        Line/Bar chart placeholder ({props.chartType || "line"})
      </p>
    </ChartContainer>
  );
}

export function formatDateLabel(value: string) {
  return value;
}
