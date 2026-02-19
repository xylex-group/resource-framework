"use client";

import type { TooltipProps } from "recharts";
import { formatDateLabel, formatChartValue } from "./date-utils";
import { DEFAULT_CHART_COLOR } from "./types";

type TooltipDataPoint = Record<string, unknown>;

export interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{
    payload: TooltipDataPoint;
    [key: string]: unknown;
  }>;
  dateKey?: string;
  valueKey?: string;
  formatDate?: (date: string) => string;
  formatValue?: (value: number | string) => string;
  className?: string;
}

export function ChartTooltipContent({
  active,
  payload,
  dateKey = "date",
  valueKey = "value",
  formatDate = formatDateLabel,
  formatValue = (v) => formatChartValue(v),
  className = "",
}: ChartTooltipContentProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  const dateValue = data[dateKey];
  const valueData = data[valueKey];

  return (
    <div
      className={`rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 text-sm shadow-lg ${className}`}
      style={{ transform: "translateZ(0)" }}
    >
      <div className="font-medium text-foreground">
        {formatDate(String(dateValue))}
      </div>
      <div className="text-muted-foreground">
        {typeof valueData === "number"
          ? formatValue(valueData)
          : String(valueData ?? "")}
      </div>
    </div>
  );
}

export const defaultTooltipCursor = {
  stroke: DEFAULT_CHART_COLOR,
  strokeWidth: 1,
  strokeDasharray: "4 4",
};

export function createChartTooltipRenderer(
  options?: Omit<ChartTooltipContentProps, "active" | "payload">,
) {
  return function TooltipRenderer(props: TooltipProps<number, string>) {
    return (
      <ChartTooltipContent
        active={props.active}
        payload={props.payload as ChartTooltipContentProps["payload"]}
        {...options}
      />
    );
  };
}
