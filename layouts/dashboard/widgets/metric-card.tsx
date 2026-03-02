"use client";

function filterToLocalToday(data: ChartDataPoint[]): ChartDataPoint[] {
  const todayLocal = new Date();
  const y = todayLocal.getFullYear();
  const m = String(todayLocal.getMonth() + 1).padStart(2, "0");
  const d = String(todayLocal.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;
  return data.filter((point) => {
    if (!point?.date) return false;
    return point.date.startsWith(todayStr);
  });
}

function buildHourlySeriesForDate(
  targetDate: Date,
  options?: { nullFutureFromHour?: number },
): ChartDataPoint[] {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");

  return Array.from({ length: 24 }).map((_, hourIndex) => {
    const hStr = String(hourIndex).padStart(2, "0");
    return {
      date: `${year}-${month}-${day} ${hStr}:00:00`,
      value:
        options?.nullFutureFromHour !== undefined &&
        hourIndex >= options.nullFutureFromHour
          ? (null as unknown as number)
          : 0,
    };
  });
}

function getTodayComparisonDate(comparePeriod: string): Date {
  const target = new Date();

  if (comparePeriod === "Previous week") {
    target.setDate(target.getDate() - 7);
    return target;
  }

  if (comparePeriod === "Previous month") {
    target.setMonth(target.getMonth() - 1);
    return target;
  }

  if (comparePeriod === "Previous year") {
    target.setFullYear(target.getFullYear() - 1);
    return target;
  }

  target.setDate(target.getDate() - 1);
  return target;
}

function getHourFromPointDate(dateValue: string): number {
  if (!dateValue) return 0;

  const spaceTimePart = dateValue.split(" ")[1];
  if (spaceTimePart) {
    const parsed = parseInt(spaceTimePart.split(":")[0] || "0", 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const isoMatch = dateValue.match(/T(\d{2}):/);
  if (isoMatch) {
    const parsed = parseInt(isoMatch[1] || "0", 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const parsedDate = new Date(dateValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.getHours();
  }

  return 0;
}

import React, { useMemo, useCallback } from "react";
import Link from "next/link";

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Info,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  ChartDataPoint,
  KpiItem,
  ListItem,
  StatusDataPoint,
  WidgetKind,
} from "./types";
import { AreaChartWidget, formatDateLabel } from "@/components/charts";
import { formatDashboardValue } from "../format-dashboard-value";

import { StatusBreakdown } from "./status-breakdown";

export interface MetricCardMeta {
  dataType?: string;
  currency?: string;
  decimals?: number;
}

function getChartSignature(data?: ChartDataPoint[]): string {
  if (!data || data.length === 0) return "empty";
  let hash = data.length;
  for (let i = 0; i < data.length; i++) {
    hash = (hash * 31 + (data[i]?.value ?? 0)) | 0;
  }
  const first = data[0];
  const last = data[data.length - 1];
  return `${data.length}|${first?.date ?? ""}|${last?.date ?? ""}|${hash}`;
}

function getKpiTrendMeta(change?: string, trend?: "up" | "down" | "neutral") {
  const resolvedTrend =
    trend ??
    (change?.trim().startsWith("+")
      ? "up"
      : change?.trim().startsWith("-")
        ? "down"
        : "neutral");

  if (resolvedTrend === "up") {
    return {
      badgeClass: "bg-primary/10 text-primary",
      icon: ArrowUpRight,
    };
  }

  if (resolvedTrend === "down") {
    return {
      badgeClass: "bg-destructive/10 text-destructive",
      icon: ArrowDownRight,
    };
  }

  return {
    badgeClass: "bg-muted text-muted-foreground",
    icon: Minus,
  };
}

interface MetricCardProps {
  title: string;
  description?: string;
  kind?: WidgetKind;
  kpiItems?: KpiItem[];
  value?: string;
  previousValue?: string;
  hasChart?: boolean;
  chartData?: ChartDataPoint[];
  comparisonChartData?: ChartDataPoint[];
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
  isEditMode?: boolean;
  queryId?: string;
  isSQLWidget?: boolean;
  queryName?: string;
  dateRange?: string;
  frequency?: string;
  compareEnabled?: boolean;
  comparePeriod?: string;
  animationIndex?: number;
  meta?: MetricCardMeta;
}

export const MetricCard = React.memo(function MetricCard({
  title,
  description,
  kind = "standard",
  kpiItems,
  value: staticValue,
  previousValue,
  hasChart = false,
  chartData: staticChartData,
  comparisonChartData,
  hasStatusBreakdown = false,
  statusBreakdownData: staticStatusBreakdownData,
  hasExploreButton = false,
  noDataMessage,
  allTimeLabel = false,
  updatedText: staticUpdatedText,
  moreDetailsLink,
  enableMoreDetails = true,
  hasScroll = false,
  listData: staticListData,
  isEditMode = false,
  queryId,
  isSQLWidget: _isSQLWidget = false,
  queryName,
  dateRange = "Last 7 days",
  frequency = "Daily",
  compareEnabled = false,
  comparePeriod = "Previous period",
  animationIndex = 0,
  meta,
}: MetricCardProps) {
  void animationIndex;

  const detailsUrl = useMemo(() => {
    if (isEditMode || !enableMoreDetails || !moreDetailsLink) return null;
    const params = new URLSearchParams();
    if (queryId) params.set("queryId", queryId);
    if (queryName) params.set("queryName", queryName);
    if (dateRange) params.set("dateRange", dateRange);
    if (frequency) params.set("frequency", frequency);
    params.set("compareEnabled", String(compareEnabled));
    if (comparePeriod) params.set("comparePeriod", comparePeriod);
    const query = params.toString();
    return query ? `${moreDetailsLink}?${query}` : moreDetailsLink;
  }, [
    isEditMode,
    enableMoreDetails,
    moreDetailsLink,
    queryId,
    queryName,
    dateRange,
    frequency,
    compareEnabled,
    comparePeriod,
  ]);

  const formatWithMeta = useCallback(
    (rawValue: number | string) => formatDashboardValue(rawValue, meta),
    [meta],
  );

  const computedValue = useMemo(
    () =>
      staticChartData && staticChartData.length > 0
        ? formatWithMeta(
            staticChartData.reduce(
              (sum, point) =>
                sum + (typeof point.value === "number" ? point.value : 0),
              0,
            ),
          )
        : "",
    [staticChartData, formatWithMeta],
  );

  const hourlySnapshotCutoffHour = useMemo(() => {
    if (!(dateRange === "Today" && frequency === "Hourly")) {
      return undefined;
    }

    return new Date().getHours();
  }, [staticChartData, dateRange, frequency]);

  const processedChartData = useMemo(() => {
    const chartData =
      dateRange === "Today" && staticChartData && staticChartData.length > 0
        ? filterToLocalToday(staticChartData)
        : staticChartData;

    if (dateRange === "Today" && frequency === "Hourly") {
      const currentHour = hourlySnapshotCutoffHour ?? new Date().getHours();
      if (chartData && chartData.length > 0) {
        return chartData.map((point) => {
          const hour = getHourFromPointDate(point.date);
          if (hour >= currentHour) {
            return { ...point, value: null as unknown as number };
          }
          return point;
        });
      } else {
        return buildHourlySeriesForDate(new Date(), {
          nullFutureFromHour: currentHour,
        });
      }
    }
    return chartData;
  }, [staticChartData, dateRange, frequency, hourlySnapshotCutoffHour]);

  const processedComparisonChartData = useMemo(() => {
    if (!(dateRange === "Today" && frequency === "Hourly")) {
      return comparisonChartData;
    }

    const currentHour = hourlySnapshotCutoffHour ?? new Date().getHours();

    const truncateFutureHours = (series: ChartDataPoint[]) =>
      series.map((point) => {
        const hour = getHourFromPointDate(point.date);
        if (hour >= currentHour) {
          return { ...point, value: null as unknown as number };
        }
        return point;
      });

    if (comparisonChartData && comparisonChartData.length > 0) {
      return truncateFutureHours(comparisonChartData);
    }

    if (!compareEnabled) {
      return undefined;
    }

    const comparisonDate = getTodayComparisonDate(comparePeriod);
    return truncateFutureHours(buildHourlySeriesForDate(comparisonDate));
  }, [
    comparisonChartData,
    dateRange,
    frequency,
    compareEnabled,
    comparePeriod,
    hourlySnapshotCutoffHour,
  ]);

  const safeChartData = processedChartData ?? [];

  let value = staticValue ?? computedValue;

  if (dateRange === "Today" && frequency === "Hourly" && processedChartData) {
    const currentSum = processedChartData.reduce(
      (sum, item) => sum + (Number(item.value) || 0),
      0,
    );

    if (meta?.currency) {
      value = formatWithMeta(currentSum);
    } else if (staticValue?.includes("%")) {
      value = `${currentSum.toFixed(2)}%`;
    } else {
      value = formatWithMeta(currentSum);
    }
  }

  if (meta?.currency && typeof value === "string" && !value.includes("%")) {
    const numericValue = Number(value.replace(/[^0-9.-]+/g, ""));
    if (!Number.isNaN(numericValue)) {
      value = formatWithMeta(numericValue);
    }
  }
  const statusBreakdownData = staticStatusBreakdownData;
  const listData = staticListData;
  const updatedText = staticUpdatedText;
  const shouldShowChart = hasChart;
  const shouldShowStatusBreakdown = hasStatusBreakdown;
  const shouldShowScroll = hasScroll;
  const shouldShowKpi = kind === "kpi" && (kpiItems?.length ?? 0) > 0;

  const cleanVal = typeof value === "string" ? value.trim() : "";
  const isEmptyValue = !cleanVal || ["—", "-", "–"].includes(cleanVal);
  const numericValue = parseFloat(cleanVal.replace(/[^0-9.-]+/g, ""));
  const isZeroValue = !isNaN(numericValue) && numericValue === 0;

  const chartHasOnlyZeros = useMemo(
    () =>
      !!safeChartData.length &&
      safeChartData.every((point) => {
        const v = Number(point.value);
        return v === 0 || Number.isNaN(v);
      }),
    [safeChartData],
  );

  const hasNoData =
    !shouldShowKpi &&
    noDataMessage &&
    (!safeChartData.length || chartHasOnlyZeros) &&
    !statusBreakdownData?.length &&
    !listData?.length &&
    (isEmptyValue || isZeroValue);

  const firstDate = processedChartData?.[0]?.date;
  const lastDate = processedChartData?.[processedChartData.length - 1]?.date;

  const showYear =
    dateRange === "Quarter to date" ||
    dateRange === "Year to date" ||
    dateRange === "All time" ||
    (compareEnabled && comparePeriod === "Previous year");

  const comparisonActive = !!processedComparisonChartData?.length;
  const effectiveComparisonData = comparisonActive
    ? processedComparisonChartData
    : undefined;
  const mainSignature = useMemo(
    () => getChartSignature(safeChartData),
    [safeChartData],
  );
  void mainSignature;

  return (
    <div className="h-full flex flex-col relative">
      {isEditMode && (
        <div className="absolute inset-0 bg-background/30 z-10 cursor-grab pointer-events-none" />
      )}
      <div className={`pb-0 pt-2 px-5 ${isEditMode ? "pr-12" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground">{title}</span>
            {description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground/50 hover:text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="border border-border bg-popover shadow-md px-3 py-1.5">
                  <p className="text-sm text-popover-foreground">
                    {description}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {hasExploreButton && !isEditMode && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 gap-1 rounded-full text-muted-foreground/60 px-3 py-1.5 text-xs font-normal"
            >
              <BarChart3 className="h-3 w-3" />
              Explore
            </Button>
          )}
          {allTimeLabel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help">
                  All time
                </span>
              </TooltipTrigger>
              <TooltipContent className="border border-border bg-popover shadow-md px-3 py-1.5">
                <p className="text-sm text-popover-foreground">
                  Shows totals across the full period and is not affected by the
                  selected date range.
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col px-5 pb-5 min-h-0">
        {hasNoData ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg mt-3 p-5">
            <span className="text-sm text-muted-foreground">
              {noDataMessage}
            </span>
          </div>
        ) : shouldShowScroll && listData ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-2">
                {listData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-foreground">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : shouldShowStatusBreakdown && statusBreakdownData ? (
          <>
            <div className="h-px bg-border/50 my-2" />
            <div className="flex-1 flex items-center">
              <StatusBreakdown data={statusBreakdownData} />
            </div>
          </>
        ) : shouldShowKpi ? (
          <div className="flex-1 mt-2 min-h-0">
            <div className="grid h-full grid-cols-2 grid-rows-2 gap-2">
              {(kpiItems?.slice(0, 4) ?? Array.from({ length: 4 })).map(
                (item, index) =>
                  (() => {
                    const trendMeta = getKpiTrendMeta(
                      item?.change,
                      item?.trend,
                    );
                    const TrendIcon = trendMeta.icon;

                    return (
                      <article
                        key={`${item?.label ?? "placeholder"}-${index}`}
                        className="h-full rounded-lg border border-border/70 bg-background/70 p-3.5 flex flex-col"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-muted-foreground leading-tight">
                            {item?.label ?? "—"}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${trendMeta.badgeClass}`}
                          >
                            <TrendIcon className="h-3 w-3" />
                            {item?.change ?? "No change"}
                          </span>
                        </div>

                        <div className="h-px bg-border/50 my-2" />

                        <div className="mt-0">
                          <p className="text-2xl font-semibold leading-none tracking-tight">
                            {item?.value ?? "—"}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
                            {item?.hint ?? "Compared to previous period"}
                          </p>
                        </div>
                      </article>
                    );
                  })(),
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-0">
              <div className="text-xl font-bold tracking-tight">{value}</div>
              {previousValue && (
                <div className="text-sm text-muted-foreground">
                  {previousValue}
                </div>
              )}
            </div>
            {shouldShowChart && (
              <div className="flex-1 mt-2 min-h-0 flex flex-col">
                <div className="relative flex-1 min-h-0 pb-0">
                  <AreaChartWidget
                    data={safeChartData}
                    comparisonData={effectiveComparisonData}
                    gradientId={`chartGradient-${title.replace(/\s+/g, "-")}`}
                    margin={{ left: 8, right: 8, bottom: 6, top: 0 }}
                    comparisonOpacity={comparisonActive ? 1 : 0}
                    showYear={showYear}
                    showAxisNotches
                    referenceLineColor="#D1D5DB"
                    axisNotchColor="#D1D5DB"
                    showYAxisEdgeLabels
                    formatValue={formatWithMeta}
                    formatYAxisLabel={
                      meta?.currency
                        ? (v: number) =>
                            new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: meta.currency!,
                              minimumFractionDigits: meta.decimals ?? 2,
                              maximumFractionDigits: meta.decimals ?? 2,
                            }).format(v)
                        : undefined
                    }
                  />
                </div>
                <div
                  className="shrink-0 flex justify-between text-[10px] text-muted-foreground mt-0 h-4"
                  style={{ paddingRight: 55 }}
                >
                  <span>
                    {firstDate
                      ? formatDateLabel(String(firstDate), { showYear })
                      : "\u00A0"}
                  </span>
                  <span>
                    {lastDate
                      ? formatDateLabel(String(lastDate), { showYear })
                      : "\u00A0"}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>{updatedText ? <span>{updatedText}</span> : <span />}</div>
          <div>
            {detailsUrl ? (
              <Link
                href={detailsUrl}
                className="text-muted-foreground text-xs hover:text-muted-foreground hover:underline transition-colors"
                aria-label="More details"
              >
                More details
              </Link>
            ) : (
              <button
                className="text-muted-foreground opacity-60 text-xs cursor-not-allowed"
                aria-label="More details (disabled)"
                aria-disabled="true"
                disabled
                title="Not available yet"
              >
                More details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
