export interface ChartDataPoint {
  date: string;
  value: number;
}

export type ExtendedChartDataPoint = ChartDataPoint & {
  [key: string]: string | number | boolean | null | undefined;
};

export interface StatusDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ListItem {
  label: string;
  value: string;
}

export type ChartType = "area" | "line" | "bar";

export interface ChartColorConfig {
  primary?: string;
  secondary?: string;
  gradient?: {
    start: string;
    startOpacity: number;
    mid?: string;
    midOpacity?: number;
    end: string;
    endOpacity: number;
  };
}

export interface ChartTooltipPayload {
  date: string;
  value: number;
  [key: string]: unknown;
}

export const DEFAULT_CHART_COLOR = "#0073E6";

export const DEFAULT_CHART_GRADIENT = {
  start: DEFAULT_CHART_COLOR,
  startOpacity: 0.3,
  mid: DEFAULT_CHART_COLOR,
  midOpacity: 0.1,
  end: DEFAULT_CHART_COLOR,
  endOpacity: 0.02,
};
