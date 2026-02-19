import { formatChartValue } from "@/components/charts";

export interface DashboardValueMeta {
  currency?: string;
  decimals?: number;
}

function coerceNumber(value: number | string): number | null {
  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  const parsed = Number(String(value).replace(/[^0-9.-]+/g, ""));
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatDashboardValue(
  value: number | string,
  meta?: DashboardValueMeta,
): string {
  const numericValue = coerceNumber(value);
  if (numericValue === null) {
    return String(value ?? "");
  }

  if (meta?.currency) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: meta.currency,
      minimumFractionDigits: meta.decimals ?? 2,
      maximumFractionDigits: meta.decimals ?? 2,
    }).format(numericValue);
  }

  return formatChartValue(numericValue);
}
