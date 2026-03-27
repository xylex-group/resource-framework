"use client";

import { useMemo, useState } from "react";
import { useUserStore } from "@/lib/stores";
import { useResourceRoute } from "../../../hooks/useResourceRoute";
import { useApiClient } from "../../../hooks/use-api-client";
import {
  registerSectionWidget,
  type SectionWidgetRendererProps,
} from "./registry";
import type { ChartWidgetProps } from "../../../resource-types";
import ErrorBlock from "@/components/ui/error";
import { buildWidgetConditions } from "../../../utils/widget-conditions";
import { Container } from "@/components/ui/container";
import { ChartContainer } from "@/components/ui/chart";
import { LineBarChartWidget } from "@/components/charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_RESOURCE_ID_COLUMN = "id";
const DEFAULT_ORGANIZATION_COLUMN = "organization_id";

type PeriodOption = "7d" | "30d" | "90d" | "6m" | "1y" | "ytd" | "all";

const PERIOD_LABELS: Record<PeriodOption, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "6m": "Last 6 months",
  "1y": "Last year",
  ytd: "Year to date",
  all: "All time",
};

const DEFAULT_PERIOD_OPTIONS: PeriodOption[] = [
  "30d",
  "90d",
  "6m",
  "1y",
  "all",
];

function getDateFromPeriod(period: PeriodOption): Date | null {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "6m": {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return sixMonthsAgo;
    }
    case "1y": {
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return oneYearAgo;
    }
    case "ytd":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
    default:
      return null;
  }
}

function getColumnValue(
  entity: Record<string, unknown>,
  column?: string,
  fallback?: string,
): string | undefined {
  if (!column && !fallback) return undefined;
  const key = column || fallback;
  const value = key ? entity[key] : undefined;
  if (value === undefined || value === null) return undefined;
  return String(value);
}

function ChartSectionWidget({ spec, entity }: SectionWidgetRendererProps) {
  const { user } = useUserStore();
  const isChartWidget = spec.type === "chart";
  const props = isChartWidget
    ? ((spec.props || {}) as ChartWidgetProps)
    : ({} as ChartWidgetProps);

  const periodOptions =
    (props.periodOptions as PeriodOption[]) || DEFAULT_PERIOD_OPTIONS;
  const defaultPeriod =
    (props.defaultPeriod as PeriodOption) || periodOptions[0] || "30d";
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodOption>(defaultPeriod);

  const resourceIdColumn = props.resourceIdColumn || DEFAULT_RESOURCE_ID_COLUMN;
  const organizationIdColumn =
    props.organizationIdColumn || DEFAULT_ORGANIZATION_COLUMN;

  const resourceId = getColumnValue(entity, resourceIdColumn);
  const entityOrganizationId = getColumnValue(entity, organizationIdColumn);
  const resolvedOrganizationId = entityOrganizationId ?? user?.organization_id;

  const userContextForRoute = user
    ? {
        user_id: user.user_id,
        organization_id: user.organization_id,
      }
    : null;

  const { resource } = useResourceRoute(
    props.resourceName || "invoices",
    userContextForRoute,
  );
  const conditions = buildWidgetConditions(props, entity);

  const columnsToFetch = useMemo(() => {
    const cols = new Set<string>([
      resourceIdColumn,
      props.targetColumn || "total",
      props.xAxisGroupBy || "created_at",
    ]);
    if (props.columns) {
      props.columns.forEach((col) => cols.add(col));
    }
    return Array.from(cols);
  }, [resourceIdColumn, props.targetColumn, props.xAxisGroupBy, props.columns]);

  const apiResult = useApiClient<Record<string, unknown>>({
    table: props.table || resource?.table || "invoices",
    schema: props.schema || resource?.schema || "public",
    conditions,
    columns: columnsToFetch,
    enabled: Boolean((props.table || resource?.table) && user?.organization_id),
    limit: props.limit ?? 1000,
  });

  const hasDataResponse = "data" in apiResult;
  const data =
    hasDataResponse &&
    Array.isArray(apiResult.data) &&
    apiResult.data.length > 0
      ? apiResult.data
      : [];

  const chartData = useMemo(() => {
    if (!data.length) return [];

    const targetColumn = props.targetColumn || "total";
    const xAxisColumn = props.xAxisGroupBy || "created_at";
    const aggregation = props.aggregation || "sum";

    // Filter data by selected period
    const periodStartDate = getDateFromPeriod(selectedPeriod);
    const filteredData = periodStartDate
      ? data.filter((item) => {
          const rawDate = item[xAxisColumn];
          if (!rawDate) return false;

          // Parse the date - handle various formats
          let itemDate: Date;
          if (rawDate instanceof Date) {
            itemDate = rawDate;
          } else {
            const dateStr = String(rawDate);
            itemDate = new Date(dateStr);
          }

          // Check if valid date
          if (isNaN(itemDate.getTime())) return true; // Keep items with unparseable dates

          return itemDate >= periodStartDate;
        })
      : data;

    if (!filteredData.length) return [];

    type ChartDataPoint = {
      [key: string]: string | number;
    };

    const counts: Record<string, number> = {};

    const grouped = filteredData.reduce<Record<string, ChartDataPoint>>(
      (acc, item) => {
        const rawValue = item[xAxisColumn];
        let xValue: string;

        if (rawValue instanceof Date) {
          xValue = rawValue.toISOString().split("T")[0];
        } else if (typeof rawValue === "string") {
          if (rawValue.includes("T")) {
            xValue = rawValue.split("T")[0];
          } else if (rawValue.includes(" ")) {
            xValue = rawValue.split(" ")[0];
          } else {
            xValue = rawValue;
          }
        } else {
          xValue = String(rawValue);
        }

        const yValue = Number(item[targetColumn]) || 0;

        if (xValue) {
          const key = xValue;
          if (!acc[key]) {
            acc[key] = { [xAxisColumn]: xValue, [targetColumn]: 0 };
            counts[key] = 0;
          }
          const current = acc[key];
          const currentCount = counts[key] || 0;
          const currentValue = current[targetColumn] as number;

          switch (aggregation) {
            case "count":
              current[targetColumn] = currentCount + 1;
              break;
            case "min":
              current[targetColumn] =
                currentCount === 0 ? yValue : Math.min(currentValue, yValue);
              break;
            case "max":
              current[targetColumn] =
                currentCount === 0 ? yValue : Math.max(currentValue, yValue);
              break;
            case "avg":
            case "sum":
            default:
              current[targetColumn] = currentValue + yValue;
              break;
          }
          counts[key] = currentCount + 1;
        }
        return acc;
      },
      {} as Record<string, ChartDataPoint>,
    );

    if (aggregation === "avg") {
      Object.entries(grouped).forEach(([key, point]) => {
        const count = counts[key] || 1;
        point[targetColumn] = (point[targetColumn] as number) / count;
      });
    }

    const sortBy = props.sortBy || xAxisColumn;
    const sortOrder = props.sortOrder || "asc";

    return Object.values(grouped).sort(
      (
        a: Record<string, string | number>,
        b: Record<string, string | number>,
      ) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === "desc" ? -comparison : comparison;
      },
    );
  }, [
    data,
    props.targetColumn,
    props.xAxisGroupBy,
    props.aggregation,
    props.sortBy,
    props.sortOrder,
    selectedPeriod,
  ]);

  if (hasDataResponse && apiResult.isError) {
    return (
      <ErrorBlock
        fullPage={false}
        type="error"
        title={`Could not load ${props.resourceName || "chart"} data`}
        content={apiResult.error ?? "Failed to load chart data"}
        isError={true}
        setIsError={() => {}}
      />
    );
  }

  const chartConfig = {
    [props.targetColumn || "total"]: {
      label: props.title || "Value",
      color: props.color || "#3b82f6",
    },
  };

  if (!isChartWidget) {
    return null;
  }

  if (chartData.length === 0 && props.emptyMessage) {
    return (
      <Container>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {props.title && (
                <h3 className="text-lg font-semibold">{props.title}</h3>
              )}
              {props.description && (
                <p className="text-sm text-muted-foreground">
                  {props.description}
                </p>
              )}
            </div>
            {props.showPeriodSelector !== false && (
              <Select
                value={selectedPeriod}
                onValueChange={(value: string) =>
                  setSelectedPeriod(value as PeriodOption)
                }
              >
                <SelectTrigger className="w-35">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {PERIOD_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            {props.emptyMessage}
          </div>
        </div>
      </Container>
    );
  }

  const xDataKey = props.xAxisGroupBy || "created_at";
  const yDataKey = props.targetColumn || "total";
  const chartType = props.chartType === "bar" ? "bar" : "line";
  const chartHeight = props.height || "h-75";

  return (
    <Container>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            {props.title && (
              <h3 className="text-lg font-semibold">{props.title}</h3>
            )}
            {props.description && (
              <p className="text-sm text-muted-foreground">
                {props.description}
              </p>
            )}
          </div>
          {props.showPeriodSelector !== false && (
            <Select
              value={selectedPeriod}
              onValueChange={(value: string) =>
                setSelectedPeriod(value as PeriodOption)
              }
            >
              <SelectTrigger className="w-35">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {PERIOD_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <ChartContainer
          config={chartConfig}
          className={`${typeof chartHeight === "string" && chartHeight.startsWith("h-") ? chartHeight : "h-75"} w-full`}
        >
          <LineBarChartWidget
            data={chartData}
            chartType={chartType}
            xDataKey={xDataKey}
            yDataKey={yDataKey}
            color={props.color || "#3b82f6"}
            colors={props.colors}
            height={typeof props.height === "number" ? props.height : undefined}
            showGrid={props.showGrid}
            showLegend={props.showLegend}
            dateFormat={props.dateFormat}
            valueFormat={props.valueFormat}
            aggregation={props.aggregation}
            sortBy={props.sortBy}
            sortOrder={props.sortOrder}
            resourceId={resourceId}
            resourceIdColumn={resourceIdColumn}
            organizationId={resolvedOrganizationId ?? undefined}
            projectId={props.projectId}
            objectPath={props.objectPath}
            bucket={props.bucket}
          />
        </ChartContainer>
      </div>
    </Container>
  );
}

registerSectionWidget("chart", ChartSectionWidget);

export { ChartSectionWidget };
