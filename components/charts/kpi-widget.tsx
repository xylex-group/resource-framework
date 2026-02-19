"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiTrend = "up" | "down" | "neutral";

export interface KpiMetric {
  label: string;
  value?: string | number | null;
  change?: string;
  trend?: KpiTrend;
  hint?: string;
}

export interface KpiWidgetProps {
  title?: string;
  subtitle?: string;
  items?: KpiMetric[];
  className?: string;
}

const FALLBACK_ITEMS: KpiMetric[] = [
  {
    label: "Revenue",
    value: null,
    change: "No data yet",
    trend: "neutral",
    hint: "Compared to previous period",
  },
  {
    label: "New customers",
    value: null,
    change: "No data yet",
    trend: "neutral",
    hint: "Compared to previous period",
  },
  {
    label: "Conversion rate",
    value: null,
    change: "No data yet",
    trend: "neutral",
    hint: "Compared to previous period",
  },
  {
    label: "Average order value",
    value: null,
    change: "No data yet",
    trend: "neutral",
    hint: "Compared to previous period",
  },
];

function getTrendStyles(trend: KpiTrend | undefined) {
  if (trend === "up") {
    return {
      badgeClass: "bg-primary/10 text-primary",
      icon: ArrowUpRight,
    };
  }

  if (trend === "down") {
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

function getDisplayValue(value: KpiMetric["value"]) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

export function KpiWidget({
  title = "Key performance indicators",
  subtitle = "Track your most important metrics in one place",
  items = FALLBACK_ITEMS,
  className,
}: KpiWidgetProps) {
  return (
    <Card className={cn("overflow-hidden border-border/60", className)}>
      <CardHeader className="gap-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.slice(0, 4).map((item, index) => {
            const trendStyles = getTrendStyles(item.trend);
            const TrendIcon = trendStyles.icon;

            return (
              <article
                key={`${item.label}-${index}`}
                className="rounded-lg border border-border/60 bg-muted/20 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      trendStyles.badgeClass,
                    )}
                  >
                    <TrendIcon className="size-3" />
                    {item.change ?? "No change"}
                  </span>
                </div>

                <div className="h-px bg-border/50 my-2" />

                <p className="text-3xl font-semibold tracking-tight">
                  {getDisplayValue(item.value)}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {item.hint ?? "Awaiting data"}
                </p>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
