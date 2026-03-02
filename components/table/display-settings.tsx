"use client";

import type { Column, Table } from "@tanstack/react-table";
import {
  ArrowDownNarrowWide,
  ArrowUpWideNarrow,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NativeSelect } from "@/components/ui/native-select";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  type DisplayConfigOption,
  useViewStore,
} from "@/lib/zustand/useViewStore";
import { prettyString } from "@/lib/format/string";
import { ResponsiveDialog } from "@/components/ui-responsive/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface DisplaySettingsProps<TData> {
  context: string;
  config: DisplayConfigOption[];
  className?: string;
  triggerLabel?: string;
  table: Table<TData>;
}

export function DisplaySettings<TData>({
  context,
  config,
  className,
  triggerLabel = "Display",
  table,
}: DisplaySettingsProps<TData>) {
  const { setDisplaySetting, getDisplaySetting, resetDisplaySettings } =
    useViewStore();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const [fieldsQuery, setFieldsQuery] = useState("");
  const fieldsQueryInputRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (!open) return;
    if (isMobile) return;

    // Wait for dialog content to mount before focusing.
    const id = window.setTimeout(() => {
      fieldsQueryInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(id);
  }, [open, isMobile]);

  // Group the config options by type
  const toggleOptions = config.filter((option) => option.type === "toggle");
  const sortOptions = config.filter((option) => option.type === "sort");
  const groupOptions = config.filter((option) => option.type === "group");
  const rowsPerPageOptions = config.filter(
    (option) => option.type === "rows_per_page",
  );

  // Filter toggle options to only include columns that can be hidden
  const filterValidToggleOptions = () => {
    return toggleOptions.filter((option) => {
      if (option.type === "toggle" && option.value.startsWith("show_")) {
        const columnId = option.value.replace("show_", "");
        const column = table.getColumn(columnId);

        return column && column.getCanHide();
      }
      return true;
    });
  };

  const validToggleOptions = filterValidToggleOptions();

  // Toggle a property (column visibility, etc.)
  const toggleProperty = (option: DisplayConfigOption) => {
    if (option.type === "toggle" && option.value.startsWith("show_")) {
      const columnId = option.value.replace("show_", "");
      const column = table.getColumn(columnId);

      if (column) {
        // Check if the column can be hidden
        if (column.getCanHide()) {
          // Toggle the column's visibility directly
          const newVisibility = !column.getIsVisible();
          column.toggleVisibility(newVisibility);

          // Update the store
          setDisplaySetting(context, option.value, newVisibility);
        }
      }
    } else {
      const currentValue = getDisplaySetting(context, option.value) === true;
      setDisplaySetting(context, option.value, !currentValue);
    }
  };

  const handleReset = () => {
    resetDisplaySettings(context);

    toggleOptions.forEach((option) => {
      if (option.type === "toggle") {
        setDisplaySetting(context, option.value, true);
      }
    });
    rowsPerPageOptions.forEach((option) => {
      if (option.defaultValue) {
        setDisplaySetting(context, option.value, option.defaultValue as string);
        if (option.type === "rows_per_page") {
          const numValue = parseInt(option.defaultValue.toString(), 10);
          if (!isNaN(numValue)) {
            table.setPageSize(numValue);
          }
        }
      }
    });

    table.getAllColumns().forEach((column) => {
      if (column.getCanHide()) {
        column.toggleVisibility(true);
      }
    });

    table.setSorting([]);
  };

  const handleSortChange = (columnId: string) => {
    if (columnId === "none") {
      table.setSorting([]);
      setDisplaySetting(context, "sort_by", null);
      return;
    }

    const column = table.getColumn(columnId);
    if (column) {
      if (!column.getIsSorted()) {
        column.toggleSorting(false); // asc
        setDisplaySetting(context, "sort_by", `${columnId}_asc`);
      } else if (column.getIsSorted() === "asc") {
        column.toggleSorting(true); // desc
        setDisplaySetting(context, "sort_by", `${columnId}_desc`);
      } else {
        column.clearSorting();
        setDisplaySetting(context, "sort_by", null);
      }
    }
  };

  const toggleSortDirection = (columnId: string) => {
    if (columnId === "none" || !columnId) {
      return;
    }

    const column = table.getColumn(columnId);
    if (column) {
      const currentDirection = column.getIsSorted();
      if (!currentDirection) {
        column.toggleSorting(false); // asc
        setDisplaySetting(context, "sort_by", `${columnId}_asc`);
      } else if (currentDirection === "asc") {
        column.toggleSorting(true); // desc
        setDisplaySetting(context, "sort_by", `${columnId}_desc`);
      } else {
        column.clearSorting();
        setDisplaySetting(context, "sort_by", null);
      }
    }
  };

  const handleRowsPerPageChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setDisplaySetting(context, "rows_per_page", value);
      table.setPageSize(numValue);
    }
  };

  const getCurrentSort = () => {
    const sortValue = getDisplaySetting(context, "sort_by") as string | null;
    if (!sortValue) return { column: null, direction: null };

    const parts = sortValue.split("_");
    if (parts.length >= 2) {
      const direction = parts[parts.length - 1];
      const column = parts.slice(0, -1).join("_");
      return { column, direction };
    }
    return { column: null, direction: null };
  };

  useEffect(() => {
    // Get the current sorting state from the table
    const sortingState = table.getState().sorting[0];

    if (sortingState) {
      const sortValue = `${sortingState.id}_${
        sortingState.desc ? "desc" : "asc"
      }`;

      const currentSortValue = getDisplaySetting(context, "sort_by");
      if (currentSortValue !== sortValue) {
        setDisplaySetting(context, "sort_by", sortValue);
      }
    } else {
      const currentSortValue = getDisplaySetting(context, "sort_by");
      if (currentSortValue !== null) {
        setDisplaySetting(context, "sort_by", null);
      }
    }
  }, [table.getState().sorting, context, getDisplaySetting]);

  const { column: currentSortColumn, direction: currentSortDirection } =
    getCurrentSort();

  // Build a list of visible and sortable columns to keep Sort by coherent
  const visibleSortableColumns = table.getAllColumns().filter((column) => {
    try {
      return (
        column &&
        column.getCanSort &&
        column.getIsVisible &&
        column.getCanSort() &&
        column.getIsVisible()
      );
    } catch (error) {
      console.error("Error filtering column:", error);
      return false;
    }
  });

  const getColumnLabel = (column: Column<TData, unknown>) => {
    try {
      const hdr = column?.columnDef?.header;
      if (typeof hdr === "string") return hdr;
      return prettyString(String(column?.id ?? ""));
    } catch (error) {
      console.error("Error getting column label:", error);
      return "Unknown Column";
    }
  };

  const normalizedFieldsQuery = fieldsQuery.trim().toLowerCase();

  const hiddenFieldsCount = (() => {
    return validToggleOptions.reduce((acc, option) => {
      const columnId =
        option.type === "toggle" && option.value.startsWith("show_")
          ? option.value.replace("show_", "")
          : null;

      let isVisible = getDisplaySetting(context, option.value) === true;

      if (typeof window !== "undefined" && columnId) {
        const column = table.getColumn(columnId);
        if (column) {
          isVisible = column.getIsVisible();
        }
      }

      return acc + (isVisible ? 0 : 1);
    }, 0);
  })();

  const fieldsToRender = (() => {
    const items = validToggleOptions.map((option) => {
      const columnId =
        option.type === "toggle" && option.value.startsWith("show_")
          ? option.value.replace("show_", "")
          : null;

      let isVisible = getDisplaySetting(context, option.value) === true;
      let isSorted = false;

      if (typeof window !== "undefined" && columnId) {
        const column = table.getColumn(columnId);
        if (column) {
          isVisible = column.getIsVisible();
          isSorted = Boolean(column.getIsSorted());
        }
      }

      return {
        option,
        label: option.label ?? "",
        isVisible,
        isSorted,
      };
    });

    const filtered =
      normalizedFieldsQuery.length === 0
        ? items
        : items.filter((x) =>
            x.label.toLowerCase().includes(normalizedFieldsQuery),
          );

    filtered.sort((a, b) => {
      // visible first, hidden last
      if (a.isVisible !== b.isVisible) return a.isVisible ? -1 : 1;
      // sorted columns first (within the same visibility group)
      if (a.isSorted !== b.isSorted) return a.isSorted ? -1 : 1;
      return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
    });

    return filtered;
  })();

  const handleDialogKeyDownCapture = (e: KeyboardEvent) => {
    if (!open) return;

    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isTypingTarget =
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      Boolean(target?.isContentEditable);

    if (isTypingTarget) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    if (e.key === "Backspace") {
      if (fieldsQuery.length > 0) {
        e.preventDefault();
        setFieldsQuery((prev) => prev.slice(0, -1));
        fieldsQueryInputRef.current?.focus();
      }
      return;
    }

    if (e.key.length !== 1) return;

    const isPrintable = /[a-z0-9 _-]/i.test(e.key);
    if (!isPrintable) return;

    e.preventDefault();
    setFieldsQuery((prev) => `${prev}${e.key}`);
    fieldsQueryInputRef.current?.focus();
  };

  const displaySettingsContent = (
    <div
      id="display-settings-dialog-content"
      className="space-y-4 "
      onKeyDownCapture={handleDialogKeyDownCapture}
    >
      <div className="space-y-4">
        {/* Sorting section */}
        {sortOptions.length > 0 && (
          <div className="space-y-3 ">
            <div className="flex items-center justify-between gap-2 px-0 mt-4">
              <Label className="w-24 shrink-0 select-none text-xs text-primary">
                Sort by
              </Label>
              <div className="flex flex-1 items-center place-content-end gap-2">
                <NativeSelect
                  className="h-8 text-xs bg-background"
                  value={currentSortColumn || "none"}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="none">No sorting</option>
                  {visibleSortableColumns.slice(0, 50).map((column) => (
                    <option key={column.id} value={column.id}>
                      {getColumnLabel(column)}
                    </option>
                  ))}
                  {visibleSortableColumns.length > 50 && (
                    <option disabled>
                      --- Showing first 50 of {visibleSortableColumns.length}{" "}
                      ---
                    </option>
                  )}
                </NativeSelect>

                <Button
                  variant="icon_v2"
                  size="sm"
                  onClick={() => toggleSortDirection(currentSortColumn || "")}
                  disabled={!currentSortColumn}
                >
                  {!currentSortDirection ? (
                    <Settings2 className="h-4 w-4" />
                  ) : currentSortDirection === "asc" ? (
                    <ArrowDownNarrowWide className="h-4 w-4" />
                  ) : (
                    <ArrowUpWideNarrow className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Visible fields section */}
        {validToggleOptions.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h5 className="select-none text-sm font-medium text-primary">
              Visible fields
            </h5>

            <div id="display-settings-search-over-fields">
              <Input
                ref={fieldsQueryInputRef}
                size="xs"
                value={fieldsQuery}
                onChange={(e) => setFieldsQuery(e.target.value)}
                placeholder="Search fields"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-secondary">
                <span>{hiddenFieldsCount} hidden</span>
                {fieldsQuery.trim().length > 0 && (
                  <button
                    type="button"
                    className="cursor-pointer underline underline-offset-2 hover:bg-hover rounded-sm px-1"
                    onClick={() => setFieldsQuery("")}
                  >
                    clear filter
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 px-0">
              {fieldsToRender.map(({ option, isVisible }) => (
                <Badge
                  key={option.value}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "cursor-pointer px-3 py-1 text-xs transition-all hover:bg-hover ",
                    isVisible
                      ? "text-primary border-(--color-border)"
                      : " text-secondary",
                  )}
                  onClick={() => toggleProperty(option)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Group options section */}
        {groupOptions.length > 0 && (
          <div className="space-y-3 ">
            <h5 className="text-sm font-medium ">Grouping</h5>
            {groupOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center justify-between gap-2"
              >
                <Label
                  htmlFor={`group-${option.value}`}
                  className="w-24 shrink-0"
                >
                  {option.label}
                </Label>
                {isMobile ? (
                  <NativeSelect
                    id={`group-${option.value}`}
                    className="h-7 text-xs"
                    value={
                      getDisplaySetting(context, option.value)?.toString() ||
                      "none"
                    }
                    onChange={(e) =>
                      setDisplaySetting(
                        context,
                        option.value,
                        e.target.value === "none" ? null : e.target.value,
                      )
                    }
                  >
                    <option value="none">No grouping</option>
                    {option.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </NativeSelect>
                ) : (
                  <Select
                    value={
                      getDisplaySetting(context, option.value)?.toString() ||
                      "none"
                    }
                    onValueChange={(value: string) =>
                      setDisplaySetting(
                        context,
                        option.value,
                        value === "none" ? null : value,
                      )
                    }
                  >
                    <SelectTrigger id={`group-${option.value}`}>
                      <SelectValue placeholder="No grouping" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No grouping</SelectItem>
                      {option.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rows per page section */}
        {rowsPerPageOptions.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-primary">Display</h5>
            {rowsPerPageOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center justify-between gap-2"
              >
                <Label className="w-24 shrink-0 text-xs text-primary">
                  {option.label}
                </Label>
                <NativeSelect
                  className="h-7 text-xs bg-background"
                  value={
                    getDisplaySetting(context, option.value)?.toString() ||
                    option.defaultValue?.toString() ||
                    ""
                  }
                  onChange={(e) => handleRowsPerPageChange(e.target.value)}
                >
                  {option.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end border-t pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="my-2 h-4 p-3 text-xs"
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>
    </div>
  );
  return (
    <div>
      <Button
        id="display-settings-trigger"
        variant="outline"
        size={"sm"}
        className={cn("flex gap-2 rounded-sm ", className)}
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal size={16} strokeWidth={2} />
        {triggerLabel}
      </Button>

      <ResponsiveDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Display Settings"
        disableMaxWidth={true}
        className="max-w-125 px-0"
        classNames={{
          title: isMobile ? "sr-only" : "",
          content: isMobile ? "mt-2 px-4" : "",
        }}
      >
        {displaySettingsContent}
      </ResponsiveDialog>
    </div>
  );
}
