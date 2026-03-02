"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartTooltipContent, defaultTooltipCursor } from "./chart-tooltip";
import { DEFAULT_CHART_COLOR } from "./types";
import { formatDateLabel } from "./date-utils";

export type LineBarChartType = "line" | "bar";

export interface LineBarChartDataPoint {
  [key: string]: string | number | boolean | null | undefined;
}

export interface LineBarChartWidgetProps {
  data: LineBarChartDataPoint[];
  chartType?: LineBarChartType;
  xDataKey: string;
  yDataKey: string;
  height?: string | number;
  color?: string;
  showGrid?: boolean;
  gridDashArray?: string;
  strokeWidth?: number;
  barFill?: string;
  className?: string;
  resourceId?: string;
  resourceIdColumn?: string;
  organizationId?: string;
  projectId?: string;
  objectPath?: string;
  bucket?: string;
  colors?: string[];
  showLegend?: boolean;
  dateFormat?: string;
  valueFormat?: string;
  aggregation?: "sum" | "avg" | "count" | "min" | "max";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function LineBarChartWidget({
  data,
  chartType = "line",
  xDataKey,
  yDataKey,
  height = "100%",
  color = DEFAULT_CHART_COLOR,
  showGrid = false,
  gridDashArray = "3 3",
  strokeWidth = 1,
  barFill,
  className = "",
  resourceId: _resourceId,
  resourceIdColumn: _resourceIdColumn,
  organizationId: _organizationId,
  projectId: _projectId,
  objectPath: _objectPath,
  bucket: _bucket,
  colors: _colors,
  showLegend: _showLegend,
  dateFormat: _dateFormat,
  valueFormat: _valueFormat,
  aggregation: _aggregation,
  sortBy: _sortBy,
  sortOrder: _sortOrder,
}: LineBarChartWidgetProps) {
  const effectiveFill = barFill ?? `var(--color-${yDataKey}, ${color})`;
  const effectiveStroke = `var(--color-${yDataKey}, ${color})`;

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "bar" ? (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray={gridDashArray} />}
            <XAxis
              dataKey={xDataKey}
              tickFormatter={(value) => formatDateLabel(value)}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip
              isAnimationActive={false}
              animationDuration={0}
              wrapperStyle={{
                transition:
                  "transform 80ms linear, top 80ms linear, left 80ms linear",
              }}
              cursor={defaultTooltipCursor}
              content={
                <ChartTooltipContent dateKey={xDataKey} valueKey={yDataKey} />
              }
            />
            <Bar dataKey={yDataKey} fill={effectiveFill} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray={gridDashArray} />}
            <XAxis
              dataKey={xDataKey}
              tickFormatter={(value) => formatDateLabel(value)}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip
              isAnimationActive={false}
              animationDuration={0}
              wrapperStyle={{
                transition:
                  "transform 80ms linear, top 80ms linear, left 80ms linear",
              }}
              cursor={defaultTooltipCursor}
              content={
                <ChartTooltipContent dateKey={xDataKey} valueKey={yDataKey} />
              }
            />
            <Line
              type="monotone"
              dataKey={yDataKey}
              stroke={effectiveStroke}
              strokeWidth={strokeWidth}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
