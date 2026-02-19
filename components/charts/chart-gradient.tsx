"use client";

import { DEFAULT_CHART_COLOR, DEFAULT_CHART_GRADIENT } from "./types";

export interface ChartGradientProps {
  id: string;
  color?: string;
  startOpacity?: number;
  midOpacity?: number;
  endOpacity?: number;
}

export function ChartGradient({
  id,
  color = DEFAULT_CHART_COLOR,
  startOpacity = DEFAULT_CHART_GRADIENT.startOpacity,
  midOpacity = DEFAULT_CHART_GRADIENT.midOpacity,
  endOpacity = DEFAULT_CHART_GRADIENT.endOpacity,
}: ChartGradientProps) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={startOpacity} />
      {midOpacity !== undefined && (
        <stop offset="50%" stopColor={color} stopOpacity={midOpacity} />
      )}
      <stop offset="100%" stopColor={color} stopOpacity={endOpacity} />
    </linearGradient>
  );
}
