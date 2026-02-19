"use client";
import { useMemo, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import type { AreaChartDataPoint } from "@/components/charts/area-chart-widget";
import { useQuery } from "@tanstack/react-query";
import { AreaChartWidget, formatDateLabel } from "@/components/charts";
import { ALL_WIDGETS } from "./widgets";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useSession } from "@/lib/better-auth/auth-client";
import type { SessionWithOrganization } from "@/lib/better-auth/auth-types";
import { formatDashboardValue } from "./format-dashboard-value";

export function TopWidget() {
  const { data: session, isPending: isSessionPending } = useSession();
  const userId = session?.user?.id ?? null;
  const activeOrganizationId =
    (session?.session as SessionWithOrganization | undefined)
      ?.activeOrganizationId ?? null;

  const topWidget = ALL_WIDGETS.find((w) => w.id === "invoices-total-daily");

  const topWidgetQuery = useQuery({
    queryKey: ["dashboard-top-widget", activeOrganizationId],
    queryFn: async () => {
      if (!topWidget?.isSQLWidget || !topWidget.queryId) return null;
      const res = await fetchWithAuth("/api/dashboard/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgets: [
            {
              queryId: topWidget.queryId,
              dateRange: "Today",
              frequency: "Hourly",
              compareEnabled: false,
              comparePeriod: "Previous period",
            },
          ],
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch top widget");
      const result = await res.json();
      return result.results?.[topWidget.queryId] || null;
    },
    enabled: !!topWidget?.queryId && !isSessionPending && !!userId,
  });

  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const showSkeleton = !isHydrated || topWidgetQuery.isLoading;

  const topWidgetData = topWidgetQuery.data;
  const topWidgetChartData = topWidgetQuery.isLoading
    ? []
    : (topWidgetData?.chartData ?? []);

  const mergedChartData = useMemo(() => {
    const _todayDate = new Date().toISOString().split("T")[0];
    const defaultChartData = Array.from({ length: 24 }, (_, i) => ({
      date: `${_todayDate} ${i.toString().padStart(2, "0")}:00`,
      value: 0,
    }));

    const currentHour = new Date().getHours();
    return defaultChartData.map((point) => {
      const actual = topWidgetChartData.find(
        (a: AreaChartDataPoint) => a.date === point.date,
      );
      const hour = parseInt(point.date.split(" ")[1]?.split(":")[0] || "0", 10);
      if (hour >= currentHour) {
        return { ...point, value: null };
      }
      return actual || point;
    });
  }, [topWidgetChartData]);

  const noInvoiceActivityToday = useMemo(
    () =>
      !mergedChartData.some(
        (point: AreaChartDataPoint) =>
          point && typeof point.value === "number" && point.value > 0,
      ),
    [mergedChartData],
  );

  const topWidgetTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: AreaChartDataPoint; dataKey?: string }>;
  }) => {
    if (!active || !payload?.length) return null;

    const mainEntry =
      payload.find((entry) => entry.dataKey === "value") ?? payload[0];
    const point = mainEntry?.payload;

    if (!point || point.value === null) return null;

    return (
      <div className="rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 text-sm shadow-lg">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-[1px] bg-primary" />
          <div className="font-medium text-foreground">
            {formatDateLabel(String(point.date), { showYear: false })}
          </div>
          <div className="ml-auto text-muted-foreground pl-2">
            {formatDashboardValue(point.value ?? 0, topWidgetData?.meta)}
          </div>
        </div>
      </div>
    );
  };

  const dottedComparisonData = useMemo(() => {
    const _todayDate = new Date().toISOString().split("T")[0];
    const defaultChartData = Array.from({ length: 24 }, (_, i) => ({
      date: `${_todayDate} ${i.toString().padStart(2, "0")}:00`,
      value: 0,
    }));
    const currentHour = new Date().getHours();

    return defaultChartData.map((point) => {
      const hour = parseInt(point.date.split(" ")[1]?.split(":")[0] || "0", 10);
      if (hour >= currentHour) {
        return point;
      }

      const actual = topWidgetChartData.find(
        (a: AreaChartDataPoint) => a.date === point.date,
      );
      return actual || point;
    });
  }, [topWidgetChartData]);

  const effectiveComparisonData = dottedComparisonData;

  const todaysRevenue = useMemo(
    () =>
      mergedChartData.reduce(
        (sum, point) =>
          sum + (point && typeof point.value === "number" ? point.value : 0),
        0,
      ),
    [mergedChartData],
  );

  return (
    <section className="space-y-4">
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">Today</h1>
      </div>
      {showSkeleton ? (
        <div className="h-60 flex items-center justify-center rounded-lg bg-card">
          <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading data</span>
          </div>
        </div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1 max-w-[75%]">
            <div
              className={`space-y-2 ${noInvoiceActivityToday ? "group/top-no-data" : ""}`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">
                  Daily invoice volume
                </span>
              </div>
              {noInvoiceActivityToday && (
                <p className="-mt-1 text-xs text-muted-foreground/80 opacity-0 transition-opacity duration-200 group-hover/top-no-data:opacity-100">
                  No invoice activity yet today.
                </p>
              )}
              <div className="relative overflow-hidden">
                <div
                  className={
                    noInvoiceActivityToday
                      ? "pointer-events-none transition-opacity duration-200 group-hover/top-no-data:opacity-55"
                      : undefined
                  }
                >
                  <AreaChartWidget
                    data={mergedChartData}
                    comparisonData={effectiveComparisonData}
                    tooltipContent={topWidgetTooltip}
                    gradientId="topWidgetGradient"
                    height="15rem"
                    margin={{ top: 10, right: 8, left: 8, bottom: 10 }}
                    yDomain={[0, "dataMax"]}
                    showReferenceLine={false}
                    activeDot={{ r: 5 }}
                  />
                </div>
                {noInvoiceActivityToday && (
                  <div className="pointer-events-none absolute -inset-2 bg-linear-to-b from-background/4 via-background/14 to-background/22 opacity-0 mask-[radial-gradient(120%_90%_at_50%_45%,black_62%,transparent_100%)] transition-opacity duration-200 group-hover/top-no-data:opacity-100" />
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 max-w-[25%]">
            <div className="flex flex-col justify-center h-full">
              <div className="pb-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Today&apos;s Revenue
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {formatDashboardValue(todaysRevenue, topWidgetData?.meta)}
                </div>
              </div>
              <div className="border-t border-border"></div>
              <div className="pt-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Today&apos;s Invoice Count
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {mergedChartData.filter((p) => p.value && p.value > 0).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
