"use client";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Check, Pencil, Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getAvailableComparePeriods } from "@/lib/dashboard/date-range-utils";
import {
  DASHBOARD_DATE_RANGE_OPTIONS,
  getAvailableFrequencies,
} from "@/lib/dashboard/widget-filter-options";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableOverlay,
} from "@/components/ui/sortable";
import {
  MetricCard,
  ALL_WIDGETS,
  DEFAULT_VISIBLE_WIDGETS,
  getAvailableWidgets,
  groupWidgetsByCategory,
  type WidgetConfig,
} from "./widgets";
import { TopWidget } from "./top-widget";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useSession } from "@/lib/better-auth/auth-client";
import type { SessionWithOrganization } from "@/lib/better-auth/auth-types";

const WIDGET_MAP = new Map(ALL_WIDGETS.map((w) => [w.id, w]));

const _colSpanSafelist =
  "col-span-1 col-span-2 col-span-3 col-span-4 col-span-5 col-span-6 sm:col-span-1 sm:col-span-2 sm:col-span-3 sm:col-span-4 sm:col-span-5 sm:col-span-6 lg:col-span-1 lg:col-span-2 lg:col-span-3 lg:col-span-4 lg:col-span-5 lg:col-span-6 xl:col-span-1 xl:col-span-2 xl:col-span-3 xl:col-span-4 xl:col-span-5 xl:col-span-6";

export interface DashboardInitialConfig {
  cardOrder: string[] | null;
  cardSettings: { dateRange?: string; frequency?: string };
}

export function Dashboard({
  initialConfig,
}: {
  initialConfig?: DashboardInitialConfig;
}) {
  const DISABLE_BUTTONS = false;
  const { state: sidebarState } = useSidebar();
  const isSidebarCollapsed = sidebarState === "collapsed";
  const { data: session, isPending: isSessionPending } = useSession();
  const userId = session?.user?.id ?? null;
  const activeOrganizationId =
    (session?.session as SessionWithOrganization | undefined)
      ?.activeOrganizationId ?? null;

  const hasServerConfig = !!initialConfig;
  const initialWidgetIds =
    hasServerConfig && initialConfig.cardOrder !== null
      ? initialConfig.cardOrder.filter((id) => WIDGET_MAP.has(id))
      : DEFAULT_VISIBLE_WIDGETS;

  const [dateRange, setDateRange] = useState(
    initialConfig?.cardSettings?.dateRange || "Last 7 days",
  );
  const [frequency, setFrequency] = useState(
    initialConfig?.cardSettings?.frequency || "Daily",
  );
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [comparePeriod, setComparePeriod] = useState("Previous period");

  const availableFrequencies = useMemo(
    () => getAvailableFrequencies(dateRange),
    [dateRange],
  );
  const availableComparePeriods = useMemo(
    () => getAvailableComparePeriods(dateRange),
    [dateRange],
  );

  useEffect(() => {
    if (availableFrequencies.length === 0) {
      setFrequency("");
    } else if (!availableFrequencies.includes(frequency)) {
      setFrequency(availableFrequencies[0]);
    }

    if (availableComparePeriods.length === 0) {
      setCompareEnabled(false);
    } else if (!availableComparePeriods.includes(comparePeriod)) {
      setComparePeriod(availableComparePeriods[0]);
    }
  }, [
    dateRange,
    frequency,
    comparePeriod,
    availableFrequencies,
    availableComparePeriods,
  ]);

  const [visibleWidgetIds, setVisibleWidgetIds] =
    useState<string[]>(initialWidgetIds);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [pendingWidgetIds, setPendingWidgetIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(
    !hasServerConfig || initialConfig.cardOrder === null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasLoaded, setHasLoaded] = useState(
    hasServerConfig && initialConfig.cardOrder !== null,
  );
  const isInitialMount = useRef(true);
  const skipNextSave = useRef(false);
  const [lastLoadedConfig, setLastLoadedConfig] = useState<{
    cardOrder: string[];
    cardSettings: { dateRange: string; frequency: string };
  } | null>(
    hasServerConfig && initialConfig.cardOrder !== null
      ? {
          cardOrder: initialWidgetIds,
          cardSettings: {
            dateRange: initialConfig?.cardSettings?.dateRange || "Last 7 days",
            frequency: initialConfig?.cardSettings?.frequency || "Daily",
          },
        }
      : null,
  );

  const sortedVisibleWidgetIds = useMemo(
    () => [...visibleWidgetIds].sort(),
    [visibleWidgetIds],
  );

  const batchWidgetQuery = useQuery({
    queryKey: [
      "dashboard-batch",
      activeOrganizationId,
      sortedVisibleWidgetIds,
      dateRange,
      frequency,
      compareEnabled,
      comparePeriod,
    ],
    queryFn: async () => {
      const widgets: {
        queryId: string;
        dateRange: string;
        frequency: string;
        compareEnabled: boolean;
        comparePeriod: string;
      }[] = [];
      visibleWidgetIds.forEach((id) => {
        const widget = WIDGET_MAP.get(id);
        if (widget?.isSQLWidget && widget.queryId) {
          widgets.push({
            queryId: widget.queryId,
            dateRange: widget.ignoresDateRange ? "All time" : dateRange,
            frequency,
            compareEnabled,
            comparePeriod,
          });
        }
      });
      if (!widgets.length) return {};
      const res = await fetchWithAuth("/api/dashboard/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets }),
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard widgets");
      const result = await res.json();
      return result.results || {};
    },
    enabled: hasLoaded && !isSessionPending && !!userId,
    placeholderData: (prev) => prev,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const batchResults = batchWidgetQuery.data || {};
  const batchLoading =
    batchWidgetQuery.isLoading || (hasLoaded && (isSessionPending || !userId));
  const batchFetching = batchWidgetQuery.isFetching;
  const [pendingConfig, setPendingConfig] = useState<{
    cardOrder: string[];
    cardSettings: { dateRange: string; frequency: string };
  } | null>(null);

  useEffect(() => {
    if (hasServerConfig && initialConfig.cardOrder !== null) return;

    if (isSessionPending || !userId) {
      return;
    }

    async function loadConfig() {
      setIsLoading(true);
      try {
        const response = await fetchWithAuth("/api/dashboard/config");
        if (response.ok) {
          const data = await response.json();
          let validIds: string[] = [];
          if (data.cardOrder && Array.isArray(data.cardOrder)) {
            validIds = (data.cardOrder as string[]).filter((id) =>
              WIDGET_MAP.has(id),
            );
            const isSame =
              validIds.length === visibleWidgetIds.length &&
              validIds.every((id, index) => id === visibleWidgetIds[index]);
            if (!isSame) {
              setVisibleWidgetIds(validIds);
            }
          }
          if (data.cardSettings) {
            if (
              data.cardSettings.dateRange &&
              data.cardSettings.dateRange !== dateRange
            ) {
              setDateRange(data.cardSettings.dateRange);
            }
            if (
              data.cardSettings.frequency &&
              data.cardSettings.frequency !== frequency
            ) {
              setFrequency(data.cardSettings.frequency);
            }
          }
          setLastLoadedConfig({
            cardOrder: validIds,
            cardSettings: {
              dateRange: data.cardSettings?.dateRange || dateRange,
              frequency: data.cardSettings?.frequency || frequency,
            },
          });
          skipNextSave.current = true;
        }
      } catch (error) {
        console.error("Failed to load dashboard config:", error);
      } finally {
        setIsLoading(false);
        setHasLoaded(true);
        setLastUpdated(new Date());
      }
    }
    loadConfig();
  }, [isSessionPending, userId, activeOrganizationId]);

  useEffect(() => {
    if (isInitialMount.current || !hasLoaded) {
      isInitialMount.current = false;
      return;
    }

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const currentConfig = {
      cardOrder: visibleWidgetIds,
      cardSettings: {
        dateRange: dateRange,
        frequency: frequency,
      },
    };
    const isConfigEqual =
      lastLoadedConfig &&
      JSON.stringify(currentConfig.cardOrder) ===
        JSON.stringify(lastLoadedConfig.cardOrder) &&
      currentConfig.cardSettings.dateRange ===
        lastLoadedConfig.cardSettings.dateRange &&
      currentConfig.cardSettings.frequency ===
        lastLoadedConfig.cardSettings.frequency;

    if (!isConfigEqual) {
      setPendingConfig(currentConfig);
    }
  }, [visibleWidgetIds, dateRange, frequency, hasLoaded, lastLoadedConfig]);

  useEffect(() => {
    if (pendingConfig && !batchFetching) {
      const configToSave = pendingConfig;
      setPendingConfig(null);

      setIsSaving(true);
      fetchWithAuth("/api/dashboard/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configToSave),
      })
        .then(() => {
          setLastLoadedConfig(configToSave);
        })
        .catch((error) => {
          console.error("Failed to save dashboard config:", error);
        })
        .finally(() => {
          setIsSaving(false);
        });
    }
  }, [pendingConfig, batchFetching]);

  const visibleWidgets = useMemo(
    () =>
      visibleWidgetIds
        .map((id) => WIDGET_MAP.get(id))
        .filter((w): w is WidgetConfig => w !== undefined),
    [visibleWidgetIds],
  );

  const availableWidgets = useMemo(
    () => getAvailableWidgets(visibleWidgetIds),
    [visibleWidgetIds],
  );

  const handleOpenAddDialog = useCallback(() => {
    setPendingWidgetIds([]);
    setIsAddDialogOpen(true);
  }, []);

  const handleAddWidgets = useCallback(() => {
    if (pendingWidgetIds.length > 0) {
      setVisibleWidgetIds((prev) => [...prev, ...pendingWidgetIds]);
    }
    setIsAddDialogOpen(false);
    setPendingWidgetIds([]);
  }, [pendingWidgetIds]);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setVisibleWidgetIds((prev) => prev.filter((id) => id !== widgetId));
  }, []);

  const togglePendingWidget = useCallback((widgetId: string) => {
    setPendingWidgetIds((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId],
    );
  }, []);

  const groupedAvailableWidgets = useMemo(
    () => groupWidgetsByCategory(availableWidgets),
    [availableWidgets],
  );

  const totalVisibleWidgets = visibleWidgets.length;

  function computeSpans(total: number, cols: number) {
    if (cols <= 1) return new Array(total).fill(1);
    const rows = Math.ceil(total / cols);
    const basePerRow = Math.floor(total / rows);
    const extra = total % rows;
    const rowCounts = Array.from(
      { length: rows },
      (_, r) => basePerRow + (r < extra ? 1 : 0),
    );

    const spans = new Array<number>(total);
    let idx = 0;
    const virtualCols = cols * 2;
    for (let r = 0; r < rows; r++) {
      const count = rowCounts[r] || 1;
      const span = Math.max(1, Math.floor(virtualCols / count));
      for (let j = 0; j < count; j++) {
        spans[idx++] = span;
      }
    }
    return spans;
  }

  const smSpans = useMemo(
    () => computeSpans(totalVisibleWidgets, 2),
    [totalVisibleWidgets],
  );
  const xlSpans = useMemo(
    () => computeSpans(totalVisibleWidgets, 3),
    [totalVisibleWidgets],
  );

  const gridColsClass = isSidebarCollapsed
    ? "grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-6 gap-2"
    : "grid grid-cols-1 sm:grid-cols-4 xl:grid-cols-6 gap-2";

  return (
    <div className="flex flex-col gap-20 p-4 min-h-screen">
      <TopWidget />

      <section className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Your overview</h2>
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 rounded-full gap-2 px-3 text-xs font-medium border-border"
                  >
                    <span className="text-muted-foreground">Date range</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-[#0073E6]">{dateRange}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {DASHBOARD_DATE_RANGE_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => setDateRange(option)}
                      className="flex items-center justify-between gap-3"
                    >
                      {option}
                      {dateRange === option && (
                        <Check className="h-3.5 w-3.5 text-[#0073E6]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {availableFrequencies.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 rounded-full gap-2 px-3 text-xs font-medium border-border"
                    >
                      <span className="text-[#0073E6]">{frequency}</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {availableFrequencies.map((freq) => (
                      <DropdownMenuItem
                        key={freq}
                        onClick={() => setFrequency(freq)}
                        className="flex items-center justify-between gap-3"
                      >
                        {freq}
                        {frequency === freq && (
                          <Check className="h-3.5 w-3.5 text-[#0073E6]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {availableComparePeriods.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 rounded-full gap-2 px-3 text-xs font-medium border-dashed border-border"
                    >
                      {compareEnabled ? (
                        <>
                          <span
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/50 text-muted-foreground"
                            onPointerDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setCompareEnabled(false);
                            }}
                          >
                            <X className="h-2.5 w-2.5" />
                          </span>
                          <span className="text-foreground">Compare</span>
                          <span className="text-muted-foreground">|</span>
                          <span className="text-[#0073E6]">
                            {comparePeriod}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-muted-foreground">
                            <Plus className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-muted-foreground">Compare</span>
                        </>
                      )}
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {availableComparePeriods.map((period) => (
                      <DropdownMenuItem
                        key={period}
                        onClick={() => {
                          setComparePeriod(period);
                          setCompareEnabled(true);
                        }}
                        className="flex items-center justify-between gap-3"
                      >
                        {period}
                        {compareEnabled && comparePeriod === period && (
                          <Check className="h-3.5 w-3.5 text-[#0073E6]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-sm font-normal"
                  onClick={handleOpenAddDialog}
                  disabled={DISABLE_BUTTONS || availableWidgets.length === 0}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader className="px-5">
                  <DialogTitle>Add widgets</DialogTitle>
                  <DialogDescription>
                    Select the widgets you want to add to your dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="px-5 max-h-100 overflow-y-auto space-y-6">
                  {availableWidgets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      All available widgets are already added to your dashboard.
                    </p>
                  ) : (
                    <>
                      {groupedAvailableWidgets.payments.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Payments
                          </h4>
                          <div className="space-y-2">
                            {groupedAvailableWidgets.payments.map((widget) => (
                              <div
                                key={widget.id}
                                className="flex items-center gap-3"
                              >
                                <Checkbox
                                  id={widget.id}
                                  checked={pendingWidgetIds.includes(widget.id)}
                                  onCheckedChange={() =>
                                    togglePendingWidget(widget.id)
                                  }
                                />
                                <Label
                                  htmlFor={widget.id}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {widget.title}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {groupedAvailableWidgets.revenue.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Revenue
                          </h4>
                          <div className="space-y-2">
                            {groupedAvailableWidgets.revenue.map((widget) => (
                              <div
                                key={widget.id}
                                className="flex items-center gap-3"
                              >
                                <Checkbox
                                  id={widget.id}
                                  checked={pendingWidgetIds.includes(widget.id)}
                                  onCheckedChange={() =>
                                    togglePendingWidget(widget.id)
                                  }
                                />
                                <Label
                                  htmlFor={widget.id}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {widget.title}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {groupedAvailableWidgets.customers.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Customers
                          </h4>
                          <div className="space-y-2">
                            {groupedAvailableWidgets.customers.map((widget) => (
                              <div
                                key={widget.id}
                                className="flex items-center gap-3"
                              >
                                <Checkbox
                                  id={widget.id}
                                  checked={pendingWidgetIds.includes(widget.id)}
                                  onCheckedChange={() =>
                                    togglePendingWidget(widget.id)
                                  }
                                />
                                <Label
                                  htmlFor={widget.id}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {widget.title}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <DialogFooter className="px-5">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddWidgets}
                    disabled={DISABLE_BUTTONS || pendingWidgetIds.length === 0}
                  >
                    Add{" "}
                    {pendingWidgetIds.length > 0 &&
                      `(${pendingWidgetIds.length})`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {totalVisibleWidgets > 0 && (
              <Button
                variant={isEditMode ? "secondary" : "outline"}
                size="sm"
                className="h-7 gap-1.5 px-2 text-sm font-normal"
                onClick={() => setIsEditMode(!isEditMode)}
                disabled={DISABLE_BUTTONS}
              >
                {isEditMode ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Done
                  </>
                ) : (
                  <>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-secondary/6">
          {(isLoading || batchLoading || batchFetching) &&
          totalVisibleWidgets > 0 ? (
            <div className={gridColsClass}>
              {(() => {
                const placeholderCount = totalVisibleWidgets;
                const placeholderSmSpans = computeSpans(placeholderCount, 2);
                const placeholderXlSpans = computeSpans(placeholderCount, 3);
                return Array.from({ length: placeholderCount }).map((_, i) => {
                  const smSpan = placeholderSmSpans[i] ?? 2;
                  const xlSpan = placeholderXlSpans[i] ?? 2;
                  const spanClass = isSidebarCollapsed
                    ? `col-span-1 sm:col-span-${smSpan} lg:col-span-${xlSpan}`
                    : `col-span-1 sm:col-span-${smSpan} xl:col-span-${xlSpan}`;
                  return (
                    <div
                      key={i}
                      className={`${spanClass} rounded-lg overflow-hidden bg-card h-96`}
                    >
                      <div className="h-full flex items-center justify-center">
                        <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading data</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : visibleWidgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                No widgets added yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddDialog}
                className="gap-1.5"
                disabled={DISABLE_BUTTONS}
              >
                <Plus className="h-3.5 w-3.5" />
                Add your first widget
              </Button>
            </div>
          ) : (
            <Sortable
              value={visibleWidgetIds}
              onValueChange={setVisibleWidgetIds}
              orientation="mixed"
            >
              <SortableContent className={gridColsClass}>
                {visibleWidgets.map((widget, index) => {
                  const baseSpan = 1;
                  const smSpan = isEditMode ? 2 : (smSpans[index] ?? 2);
                  const xlSpan = isEditMode ? 2 : (xlSpans[index] ?? 2);
                  const spanClass = isSidebarCollapsed
                    ? `col-span-${baseSpan} sm:col-span-${smSpan} lg:col-span-${xlSpan}`
                    : `col-span-${baseSpan} sm:col-span-${smSpan} xl:col-span-${xlSpan}`;
                  let widgetData = undefined;
                  if (widget.isSQLWidget && widget.queryId) {
                    widgetData = batchResults[widget.queryId] || {};
                  }
                  return (
                    <SortableItem
                      key={widget.id}
                      value={widget.id}
                      asHandle={isEditMode}
                      asChild
                    >
                      <div
                        className={`${spanClass} relative rounded-lg overflow-hidden bg-card h-96`}
                      >
                        {isEditMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleRemoveWidget(widget.id);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="absolute top-2 right-2 z-30 p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            aria-label="Remove widget"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        <MetricCard
                          title={widget.title}
                          description={widget.description}
                          kind={widget.kind}
                          kpiItems={widget.kpiItems}
                          value={widgetData?.value ?? widget.value}
                          previousValue={
                            widgetData?.previousValue ?? widget.previousValue
                          }
                          hasChart={widget.hasChart}
                          chartData={widgetData?.chartData ?? widget.chartData}
                          comparisonChartData={widgetData?.previousChartData}
                          hasExploreButton={widget.hasExploreButton}
                          noDataMessage={widget.noDataMessage}
                          allTimeLabel={
                            widget.ignoresDateRange || widget.allTimeLabel
                          }
                          updatedText={
                            widgetData?.updatedText ??
                            (lastUpdated
                              ? `Updated ${lastUpdated.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : widget.updatedText)
                          }
                          moreDetailsLink={widget.moreDetailsLink}
                          enableMoreDetails={widget.enableMoreDetails}
                          hasScroll={widget.hasScroll}
                          listData={widgetData?.listData ?? widget.listData}
                          isEditMode={isEditMode}
                          queryId={widget.queryId}
                          isSQLWidget={widget.isSQLWidget}
                          queryName={widget.queryName}
                          dateRange={dateRange}
                          frequency={frequency}
                          compareEnabled={compareEnabled}
                          comparePeriod={comparePeriod}
                          hasStatusBreakdown={widget.hasStatusBreakdown}
                          statusBreakdownData={
                            widgetData?.statusBreakdownData ??
                            widget.statusBreakdownData
                          }
                          animationIndex={index}
                          meta={widgetData?.meta}
                        />
                      </div>
                    </SortableItem>
                  );
                })}
              </SortableContent>
              <SortableOverlay>
                {({ value }) => {
                  const widget = WIDGET_MAP.get(String(value));
                  if (!widget) return null;
                  const widgetData =
                    widget.isSQLWidget && widget.queryId
                      ? batchResults[widget.queryId] || {}
                      : {};
                  return (
                    <div className="rounded-lg overflow-hidden bg-card h-96 opacity-90">
                      <MetricCard
                        title={widget.title}
                        description={widget.description}
                        kind={widget.kind}
                        kpiItems={widget.kpiItems}
                        value={widgetData?.value ?? widget.value}
                        previousValue={
                          widgetData?.previousValue ?? widget.previousValue
                        }
                        hasChart={widget.hasChart}
                        chartData={widgetData?.chartData ?? widget.chartData}
                        comparisonChartData={widgetData?.previousChartData}
                        hasExploreButton={widget.hasExploreButton}
                        noDataMessage={widget.noDataMessage}
                        allTimeLabel={widget.allTimeLabel}
                        updatedText={
                          widgetData?.updatedText
                            ? widgetData.updatedText
                            : lastUpdated
                              ? `Updated ${lastUpdated.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : widget.updatedText
                        }
                        moreDetailsLink={widget.moreDetailsLink}
                        enableMoreDetails={widget.enableMoreDetails}
                        hasScroll={widget.hasScroll}
                        listData={widgetData?.listData ?? widget.listData}
                        isEditMode={isEditMode}
                        queryId={widget.queryId}
                        isSQLWidget={widget.isSQLWidget}
                        queryName={widget.queryName}
                        dateRange={dateRange}
                        frequency={frequency}
                        compareEnabled={compareEnabled}
                        comparePeriod={comparePeriod}
                        hasStatusBreakdown={widget.hasStatusBreakdown}
                        statusBreakdownData={
                          widgetData?.statusBreakdownData ??
                          widget.statusBreakdownData
                        }
                        animationIndex={0}
                        meta={widgetData?.meta}
                      />
                    </div>
                  );
                }}
              </SortableOverlay>
            </Sortable>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
