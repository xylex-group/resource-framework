"use client";

import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
  ReferenceLine,
  Customized,
} from "recharts";
import type { ChartColorConfig, ChartTooltipPayload } from "./types";
import { ChartGradient } from "./chart-gradient";
import { defaultTooltipCursor } from "./chart-tooltip";
import { formatDateLabel, formatChartValue } from "./date-utils";
import { DEFAULT_CHART_COLOR } from "./types";

const EMPTY_CHART_TOP_VALUE = 0.01;

export type AreaChartDataPoint = {
  date: string;
  value: number;
};

export interface AreaChartWidgetProps {
  data: AreaChartDataPoint[];
  comparisonData?: AreaChartDataPoint[];
  gradientId?: string;
  xDataKey?: string;
  yDataKey?: string;
  height?: string | number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  color?: string;
  colorConfig?: ChartColorConfig;
  curveType?: "monotone" | "monotoneX" | "linear" | "step";
  showReferenceLine?: boolean;
  referenceLineColor?: string;
  strokeWidth?: number;
  strokeDashed?: boolean;
  showActiveDot?: boolean;
  activeDot?: {
    r?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
  hideXAxis?: boolean;
  hideYAxis?: boolean;
  yDomain?: [
    number | "auto" | "dataMin" | "dataMax",
    number | "auto" | "dataMin" | "dataMax",
  ];
  tooltipContent?: React.ComponentType<{
    active?: boolean;
    payload?: Array<{ payload: AreaChartDataPoint }>;
  }>;
  formatDate?: (date: string) => string;
  formatValue?: (value: number | string) => string;
  className?: string;
  revealKey?: number;
  animationDuration?: number;
  comparisonOpacity?: number;
  showYear?: boolean;
  showAxisNotches?: boolean;
  axisNotchColor?: string;
  axisNotchHeight?: number;
  disableRevealAnimation?: boolean;
  showYAxisEdgeLabels?: boolean;
  formatYAxisLabel?: (value: number) => string;
  yAxisEdgeLabelColor?: string;
}

export const AreaChartWidget = React.memo(function AreaChartWidget({
  data,
  comparisonData,
  gradientId = "areaChartGradient",
  xDataKey = "date",
  yDataKey = "value",
  height = "100%",
  margin = { top: 10, right: 8, left: 8, bottom: 6 },
  color = DEFAULT_CHART_COLOR,
  colorConfig,
  curveType = "linear",
  showReferenceLine = true,
  referenceLineColor = "#E6EEF9",
  strokeWidth = 1,
  strokeDashed = false,
  showActiveDot = true,
  activeDot = {
    r: 4,
    fill: DEFAULT_CHART_COLOR,
    stroke: "#fff",
    strokeWidth: 2,
  },
  hideXAxis = true,
  hideYAxis: _hideYAxis = true,
  yDomain = [0, "auto"],
  tooltipContent: CustomTooltipContent,
  formatDate,
  formatValue,
  className = "",
  revealKey = 0,
  animationDuration = 1200,
  comparisonOpacity = 1,
  showYear = false,
  showAxisNotches = false,
  axisNotchColor = referenceLineColor,
  axisNotchHeight = 6,
  disableRevealAnimation = false,
  showYAxisEdgeLabels = false,
  formatYAxisLabel,
  yAxisEdgeLabelColor,
}: AreaChartWidgetProps) {
  const [revealPercent, setRevealPercent] = React.useState(
    disableRevealAnimation ? 100 : 0,
  );
  const revealRef = React.useRef<number | null>(null);
  const prevRevealKey = React.useRef(revealKey);

  React.useEffect(() => {
    if (disableRevealAnimation) {
      setRevealPercent(100);
    }
  }, [disableRevealAnimation]);

  React.useEffect(() => {
    if (disableRevealAnimation) {
      prevRevealKey.current = revealKey;
      return;
    }
    if (revealKey !== prevRevealKey.current) {
      prevRevealKey.current = revealKey;
      setRevealPercent(0);
    }
  }, [revealKey, disableRevealAnimation]);

  React.useEffect(() => {
    if (disableRevealAnimation) return;
    if (revealPercent >= 100) return;
    const start = performance.now();
    const dur = animationDuration;
    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / dur, 1);
      // cubic-bezier ease-out approximation
      const eased = 1 - Math.pow(1 - t, 3);
      setRevealPercent(eased * 100);
      if (t < 1) {
        revealRef.current = requestAnimationFrame(tick);
      }
    }
    revealRef.current = requestAnimationFrame(tick);
    return () => {
      if (revealRef.current) cancelAnimationFrame(revealRef.current);
    };
  }, [revealPercent === 0, animationDuration, disableRevealAnimation]);
  const dateFormatter = React.useCallback(
    (date: string) => {
      if (formatDate) return formatDate(date);
      return formatDateLabel(date, { showYear });
    },
    [formatDate, showYear],
  );
  const effectiveColor = colorConfig?.primary ?? color;
  const gradientConfig = colorConfig?.gradient ?? {
    start: effectiveColor,
    startOpacity: 0.3,
    mid: effectiveColor,
    midOpacity: 0.1,
    end: effectiveColor,
    endOpacity: 0.02,
  };

  const strokeDasharray = strokeDashed ? "4 4" : undefined;

  let forcedYDomain = yDomain;
  const allZero =
    !!data &&
    data.length > 0 &&
    data.every((point) => Number(point.value ?? 0) === 0) &&
    (!comparisonData ||
      comparisonData.every((point) => Number(point.value ?? 0) === 0));

  if (!data || data.length === 0) {
    forcedYDomain = [0, EMPTY_CHART_TOP_VALUE];
  } else {
    if (allZero) {
      forcedYDomain = [0, EMPTY_CHART_TOP_VALUE];
    } else if (showYAxisEdgeLabels) {
      forcedYDomain = [0, "dataMax"];
    }
  }

  const isEmpty = !data || data.length === 0;
  const isEmptyLike = isEmpty || allZero;

  const renderData = React.useMemo(() => {
    if (isEmpty) {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return Array.from({ length: 24 }).map((_, idx) => {
        const d = new Date(start);
        d.setHours(start.getHours() + idx);
        return { date: d.toISOString(), value: 0 };
      });
    }

    const hasComparison = !!comparisonData && comparisonData.length > 0;
    return data.map((point, index) => ({
      ...point,
      comparisonValue: hasComparison
        ? (comparisonData[index]?.value ?? null)
        : null,
      comparisonDate: hasComparison
        ? (comparisonData[index]?.date ?? null)
        : null,
    }));
  }, [data, comparisonData, isEmpty]);

  const showReferenceLineUsed = showReferenceLine && !isEmpty;

  const peakValue = React.useMemo(() => {
    const mainMax =
      data && data.length > 0
        ? Math.max(...data.map((p) => Number(p.value) || 0))
        : 0;
    const compMax =
      comparisonData && comparisonData.length > 0
        ? Math.max(...comparisonData.map((p) => Number(p.value) || 0))
        : 0;
    return Math.max(mainMax, compMax);
  }, [data, comparisonData]);

  const defaultYAxisLabelFormatter = React.useCallback(
    (value: number) => formatChartValue(value),
    [],
  );

  const yAxisLabelFormatter = formatYAxisLabel ?? defaultYAxisLabelFormatter;

  const yAxisTopValue = isEmptyLike ? EMPTY_CHART_TOP_VALUE : peakValue;
  const edgeTickFormatter = React.useCallback(
    (value: number) => {
      if (!isEmptyLike) return yAxisLabelFormatter(value);
      return value === EMPTY_CHART_TOP_VALUE ? "0.01" : "0";
    },
    [isEmptyLike, yAxisLabelFormatter],
  );

  return (
    <div
      className={`w-full ${className}`}
      style={{
        height,
        clipPath:
          revealPercent < 100
            ? `inset(0 ${100 - revealPercent}% 0 0)`
            : undefined,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={renderData} margin={margin}>
          <defs>
            <ChartGradient
              id={gradientId}
              color={gradientConfig.start}
              startOpacity={gradientConfig.startOpacity}
              midOpacity={gradientConfig.midOpacity}
              endOpacity={gradientConfig.endOpacity}
            />
          </defs>

          {hideXAxis ? (
            isEmpty ? (
              <XAxis
                dataKey={xDataKey}
                axisLine={{
                  stroke: effectiveColor,
                  strokeDasharray: strokeDasharray,
                }}
                tickLine={false}
                tick={false}
                height={12}
              />
            ) : (
              <XAxis
                dataKey={xDataKey}
                axisLine={
                  showYAxisEdgeLabels
                    ? { stroke: referenceLineColor, strokeWidth: 1 }
                    : false
                }
                tickLine={false}
                tick={false}
                height={12}
              />
            )
          ) : (
            <XAxis
              dataKey={xDataKey}
              axisLine={{
                stroke: showYAxisEdgeLabels
                  ? referenceLineColor
                  : effectiveColor,
                strokeDasharray: showYAxisEdgeLabels
                  ? undefined
                  : strokeDasharray,
              }}
            />
          )}

          {showYAxisEdgeLabels ? (
            <YAxis
              yAxisId="edge-labels"
              domain={forcedYDomain}
              orientation="right"
              ticks={yAxisTopValue > 0 ? [0, yAxisTopValue] : [0]}
              tickFormatter={edgeTickFormatter}
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 10,
                fill: yAxisEdgeLabelColor ?? "currentColor",
                fillOpacity: 0.5,
              }}
              width={55}
            />
          ) : null}
          <YAxis hide domain={forcedYDomain} />

          <Tooltip
            isAnimationActive={false}
            animationDuration={0}
            wrapperStyle={{
              transition:
                "transform 80ms linear, top 80ms linear, left 80ms linear",
            }}
            cursor={defaultTooltipCursor}
            content={
              CustomTooltipContent ? (
                <CustomTooltipContent />
              ) : (
                (props: TooltipProps<number, string>) => {
                  if (
                    !props.active ||
                    !props.payload ||
                    !props.payload.length
                  ) {
                    return null;
                  }
                  const data = props.payload[0].payload as ChartTooltipPayload;
                  const dateValue = data[xDataKey];
                  const valueData = data[yDataKey];

                  if (valueData === null) return null;

                  const comparisonValue = data.comparisonValue;
                  const comparisonDate = data.comparisonDate;

                  return (
                    <div className="rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 text-sm shadow-lg">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-[1px]"
                          style={{ backgroundColor: effectiveColor }}
                        />
                        <div className="font-medium text-foreground">
                          {dateFormatter(String(dateValue))}
                        </div>
                        <div className="ml-auto text-muted-foreground pl-2">
                          {typeof valueData === "number"
                            ? formatValue
                              ? formatValue(valueData)
                              : valueData
                            : String(valueData ?? "")}
                        </div>
                      </div>
                      {comparisonValue !== undefined &&
                        comparisonValue !== null && (
                          <div className="mt-1 flex items-center gap-2 text-muted-foreground/70">
                            <div className="h-2 w-2 rounded-[1px] bg-muted-foreground/20" />
                            <div className="font-medium">
                              {comparisonDate
                                ? dateFormatter(String(comparisonDate))
                                : "Previous"}
                            </div>
                            <div className="ml-auto pl-2">
                              {typeof comparisonValue === "number"
                                ? formatValue
                                  ? formatValue(comparisonValue)
                                  : comparisonValue
                                : String(comparisonValue)}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                }
              )
            }
          />

          {showReferenceLineUsed && !showYAxisEdgeLabels && (
            <ReferenceLine y={0} stroke={referenceLineColor} strokeWidth={1} />
          )}

          {showYAxisEdgeLabels && yAxisTopValue > 0 && (
            <ReferenceLine
              y={yAxisTopValue}
              stroke={referenceLineColor}
              strokeWidth={1}
            />
          )}

          {showAxisNotches && (
            <Customized
              component={({
                x = 0,
                y = 0,
                width = 0,
                height = 0,
                offset,
              }: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
                offset?: {
                  left?: number;
                  top?: number;
                  width?: number;
                  height?: number;
                };
              }) => {
                const left = offset?.left ?? x;
                const top = offset?.top ?? y;
                const chartWidth = offset?.width ?? width;
                const chartHeight = offset?.height ?? height;

                if (!chartWidth || !chartHeight) return null;
                const notchY = top + chartHeight;

                return (
                  <g>
                    <line
                      x1={left}
                      x2={left}
                      y1={notchY}
                      y2={notchY + axisNotchHeight}
                      stroke={axisNotchColor}
                      strokeWidth={1}
                      strokeLinecap="round"
                    />
                    <line
                      x1={left + chartWidth}
                      x2={left + chartWidth}
                      y1={notchY}
                      y2={notchY + axisNotchHeight}
                      stroke={axisNotchColor}
                      strokeWidth={1}
                      strokeLinecap="round"
                    />
                  </g>
                );
              }}
            />
          )}

          <Area
            type={curveType}
            dataKey="comparisonValue"
            stroke={colorConfig?.secondary ?? "#94a3b8"}
            strokeWidth={strokeWidth}
            strokeDasharray="4 4"
            fill="none"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            style={{
              opacity: comparisonOpacity,
              transition: "opacity 0.35s ease-in-out",
            }}
          />
          <Area
            type={curveType}
            dataKey={yDataKey}
            stroke={effectiveColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            fill={effectiveColor}
            fillOpacity={0.1}
            dot={false}
            activeDot={
              showActiveDot
                ? {
                    r: activeDot.r ?? 4,
                    fill: activeDot.fill ?? effectiveColor,
                    stroke: activeDot.stroke ?? "#fff",
                    strokeWidth: activeDot.strokeWidth ?? 2,
                  }
                : false
            }
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
