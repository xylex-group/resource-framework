"use client";
import type { ColumnDef, HeaderContext, Row } from "@tanstack/react-table";
import type React from "react";
import { Flag } from "@/components/ui/flag";
import { Badge } from "@/components/ui/badge";
import {
  formatUnixSecondsToDate,
  formatUnixSecondsToMonthDayTime,
} from "@/lib/date-utils";
import { prettyString } from "@/lib/format/string";
import { AssigneesCell } from "@/packages/resource-framework/components/cells/AssigneesCell";
import type {
  ColumnRegistry,
  LeanColumnSpec,
  RegistryRenderer,
} from "../resource-types";

export type { ColumnRegistry, LeanColumnSpec, RegistryRenderer };

/**
 * ===========================================================================================
 * COLUMN BUILDER TYPE SAFETY
 * ===========================================================================================
 *
 * All column builder functions (buildStatusColumn, buildCurrencyColumn, etc.) MUST return
 * ColumnDef<TData> which is the TanStack Table column definition type.
 *
 * The RegistryRenderer<TData> type enforces this via its `build` property:
 *   build: (opts: { key: ...; header?: string }) => ColumnDef<TData>
 *
 * This ensures type safety and prevents the error:
 *   "Type '() => Element' is not assignable to type 'string'"
 *
 * Each ColumnDef MUST include:
 *   - header: string | (() => JSX.Element)
 *   - accessorKey: string
 *   - cell: ({ row }) => JSX.Element
 *   - column_name: string (custom property for identification)
 *
 * Optional properties include:
 *   - size, minSize, maxSize: number
 *   - enableSorting: boolean
 *   - sortingFn: (rowA, rowB, columnId) => number
 *   - filterFn: (row, columnId, filterValue) => boolean
 *   - meta: { datatype, filterable, className, etc. }
 *
 * ===========================================================================================
 */

/**
 * Creates a default text cell renderer for a column
 * @param key - The data key to display
 * @returns Cell renderer function
 */
const defaultTextCell = <TData,>(key: keyof TData) => {
  const CellRenderer = (
    { row }: { row: { original: TData } },
  ): React.ReactNode => {
    const value: unknown =
      (row.original as Record<string, unknown>)[key as string];
    return <span className="truncate text-primary">{String(value ?? "")}</span>;
  };
  CellRenderer.displayName = `DefaultTextCell_${String(key)}`;
  return CellRenderer;
};

/**
 * Renders a column header with standard styling
 * @param header - Header text to display
 * @returns Rendered header element
 */
function renderHeader(header: string) {
  return <span className="text-[12px] capitalize text-primary">{header}</span>;
}

// Status -> Badge renderer with custom sort order
export const STATUS_SORT_ORDER = [
  "draft",
  "pending",
  "draft_booking",
  "open",
  "active",
  "paid",
  "without_document",
  "to_be_received",
  "accepted",
  "match",
  "completed",
  "overdue",
  "uncollectable",
  "cancelled",
  "expired",
  "no_match",
];

const MONTH_SORT_ORDER = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

/**
 * Gets the sort index for a status value based on predefined order
 * @param status - Status string to get index for
 * @returns Sort index number
 */
function getStatusSortIndex(status: string) {
  const idx = STATUS_SORT_ORDER.indexOf(status);
  return idx === -1 ? STATUS_SORT_ORDER.length : idx;
}

// Month -> Normal text renderer with custom sort order
/**
 * Builds a month column with custom sort order
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildMonthColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as Record<string, unknown>)[key as string];
      return (
        <span className="truncate text-primary">{String(value ?? "")}</span>
      );
    },
    size: 120,
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      const a = rowA.getValue(columnId);
      const b = rowB.getValue(columnId);
      const aIdx = MONTH_SORT_ORDER.indexOf(String(a ?? "").toUpperCase());
      const bIdx = MONTH_SORT_ORDER.indexOf(String(b ?? "").toUpperCase());
      if (aIdx === bIdx) {
        return String(a ?? "").localeCompare(String(b ?? ""));
      }
      return (
        (aIdx === -1 ? MONTH_SORT_ORDER.length : aIdx) -
        (bIdx === -1 ? MONTH_SORT_ORDER.length : bIdx)
      );
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

// Status -> Badge renderer with custom sort order
/**
 * Builds a status column with badge rendering and custom sort order
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildStatusColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;

  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as Record<string, unknown>)[key as string];
      if (!value) return null;
      // Trim whitespace including tabs, newlines, etc.
      const text = String(value).trim();
      // Use the actual value as variant to match badge variants like "active", "pending", etc.
      // Convert to lowercase and replace spaces with underscores
      const variant = text.toLowerCase().replace(/\s+/g, "_");

      return (
        <Badge variant={variant as unknown as "default"}>
          {prettyString(text)}
        </Badge>
      );
    },
    size: 120,
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      const a = rowA.getValue(columnId);
      const b = rowB.getValue(columnId);
      const aIdx = getStatusSortIndex(String(a ?? "").toLowerCase());
      const bIdx = getStatusSortIndex(String(b ?? "").toLowerCase());
      if (aIdx === bIdx) {
        return String(a ?? "").localeCompare(String(b ?? ""));
      }
      return aIdx - bIdx;
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

// Render a percentage column, formatting numbers (0.12 => '12%') and supporting sorting/filtering.
/**
 * Builds a percentage column with formatting and filtering support
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildPercentageColumn<TData>(
  opts: {
    key?: Extract<keyof TData, string | number>;
    header?: string;
  } = {},
): ColumnDef<TData> {
  const { key, header } = opts as { key?: string; header?: string };
  const columnKey = key as string;

  return {
    header: () => renderHeader(header ?? prettyString(columnKey)),
    accessorKey: columnKey,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as Record<string, unknown>)[columnKey];
      if (value === undefined || value === null || isNaN(Number(value))) {
        return <span className="text-primary">—</span>;
      }
      let percentValue = Number(value);
      // If value is in decimals (e.g., 0.15), convert to percentage
      if (percentValue > 0 && percentValue <= 1) {
        percentValue = percentValue * 100;
      }
      return (
        <div className="flex flex-row font-medium text-primary">
          {percentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          <div className="w-px"></div>%
        </div>
      );
    },
    size: 110,
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      const a = Number(rowA.getValue(columnId));
      const b = Number(rowB.getValue(columnId));
      return (isNaN(a) ? -Infinity : a) - (isNaN(b) ? -Infinity : b);
    },
    filterFn: (row: Row<TData>, columnId: string, filterValue: unknown) => {
      // basic filter for percentage: supports single value or range: "10" or "10-20"
      const raw = row.getValue(columnId);
      let val = Number(raw);
      if (val > 0 && val <= 1) val = val * 100;
      if (!filterValue) return true;
      if (typeof filterValue === "string" && filterValue.includes("-")) {
        const [min, max] = filterValue.split("-").map(Number);
        return val >= (min || 0) && val <= (max || 100);
      }
      const target = Number(filterValue);
      return !isNaN(target) ? val === target : true;
    },
    column_name: columnKey,
  } as unknown as ColumnDef<TData>;
}

// Time (unix ms or ISO date string) -> relative timestamp
// MMM DD, HH:MM
// Jan 12, 08:12
/**
 * Builds a time column with date formatting
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildTimeColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;

  /**
   * Parses various date formats to unix seconds
   * @param val - Value to parse
   * @returns Unix seconds or null
   */
  function parseToUnixSeconds(val: unknown): number | null {
    if (val == null) return null;
    if (typeof val === "number") {
      if (val > 1e12) return Math.floor(val / 1000);
      return val;
    }
    if (typeof val === "string") {
      const isoDateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(val);
      if (isoDateOnlyMatch) {
        const date = new Date(val + "T00:00:00Z");
        if (!isNaN(date.getTime())) {
          return Math.floor(date.getTime() / 1000);
        }
      }
      const isoWithTimeMatch =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?([+-]\d{2}:\d{2}|Z)?$/
          .test(
            val,
          );
      if (isoWithTimeMatch) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return Math.floor(date.getTime() / 1000);
        }
      }
      const asNum = Number(val);
      if (!isNaN(asNum)) {
        if (asNum > 1e12) return Math.floor(asNum / 1000);
        return asNum;
      }
      const parsed = Date.parse(val);
      if (!isNaN(parsed)) {
        return Math.floor(parsed / 1000);
      }
    }
    return null;
  }

  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as Record<string, unknown>)[key as string];
      const unixSeconds = parseToUnixSeconds(value);
      if (unixSeconds == null) return null as unknown as React.ReactNode;
      return (
        <span className="whitespace-nowrap text-primary">
          {formatUnixSecondsToMonthDayTime(unixSeconds)}
        </span>
      ) as unknown as React.ReactNode;
    },
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      const a = parseToUnixSeconds(rowA.getValue(columnId));
      const b = parseToUnixSeconds(rowB.getValue(columnId));
      return Number(a ?? 0) - Number(b ?? 0);
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

// Time (unix ms) -> relative timestamp
// MMM DD
// Jan 12
/**
 * Builds a day column with date formatting
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildDayColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as Record<string, unknown>)[key as string];
      if (value == null) return null as unknown as React.ReactNode;
      return (
        <span className="whitespace-nowrap text-primary">
          {formatUnixSecondsToDate(Number(value))}
        </span>
      ) as unknown as React.ReactNode;
    },
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      // Sort by the raw unix time value for easier comparison
      const a = rowA.getValue(columnId);
      const b = rowB.getValue(columnId);
      return Number(a ?? 0) - Number(b ?? 0);
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

/**
 * Builds a boolean column with yes/no badge rendering
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildBooleanYesNoColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = Boolean(
        (row.original as Record<string, unknown>)[key as string],
      );
      return (
        <Badge
          variant={(value ? "true" : "false") as unknown as "default"}
          className="capitalize"
        >
          {value ? "yes" : "no"}
        </Badge>
      ) as unknown as React.ReactNode;
    },
    enableSorting: false,
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

// render country codes to country flag + code
/**
 * Builds a country code column with flag rendering
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildCountryCodeColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as Record<string, unknown>)[key as string];
      if (!value) return null;
      // Always use the 2-letter ISO code
      return (
        <span className="flex w-fit items-center gap-2 rounded-sm border bg-muted p-0.5 px-1">
          <Flag country={String(value)} size={20} includeCountryCode />
        </span>
      ) as unknown as React.ReactNode;
    },
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      // Sort alphabetically by country code
      const a = String(rowA.getValue(columnId) ?? "");
      const b = String(rowB.getValue(columnId) ?? "");
      return a.localeCompare(b);
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

// Duration in ms -> adds ms suffix
/**
 * Builds a duration column with millisecond suffix
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildDurationMsColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as Record<string, unknown>)[key as string];
      return <span className="text-primary">{value ? `${value}ms` : ""}</span>;
    },
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      const a = Number(rowA.getValue(columnId) ?? 0);
      const b = Number(rowB.getValue(columnId) ?? 0);
      return a - b;
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

// Seconds -> adds s suffix (e.g., expires_in)
/**
 * Builds a seconds column with second suffix
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildSecondsColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as Record<string, unknown>)[key as string];
      return <span className="text-primary">{value ? `${value}s` : ""}</span>;
    },
    enableSorting: false,
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

// Long ids -> break-all styling
/**
 * Builds a text column with break-all styling for long IDs
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildBreakAllTextColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: function Cell({ row }: { row: { original: TData } }) {
      return (
        <span className="break-all text-primary">
          {String(
            (row.original as Record<string, unknown>)[key as string] ?? "",
          )}
        </span>
      );
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

// JSON -> stringified column
/**
 * Builds a JSON column with stringified rendering
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildJsonStringColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: function Cell({ row }: { row: { original: TData } }) {
      const value = (row.original as Record<string, unknown>)[key as string];
      let displayValue = "";
      if (value === null || value === undefined) {
        displayValue = "";
      } else if (typeof value === "object") {
        try {
          displayValue = JSON.stringify(value);
        } catch {
          displayValue = String(value);
        }
      } else {
        displayValue = String(value);
      }
      return <span className="truncate text-primary">{displayValue}</span>;
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

// Fallback generic column builder
/**
 * Builds a generic column with basic text rendering
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildGenericColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: function Cell({ row }: { row: { original: TData } }) {
      const value = (row.original as Record<string, unknown>)[key as string];
      return (
        <span className="truncate text-primary">{String(value ?? "")}</span>
      );
    },
    enableSorting: true,
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

/**
 * Builds a column that displays text in uppercase
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildUppercaseColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: function Cell({ row }: { row: { original: TData } }) {
      const value: unknown =
        (row.original as Record<string, unknown>)[key as string];
      return (
        <span className="truncate text-primary">
          {String(value ?? "").toUpperCase()}
        </span>
      ) as unknown as React.ReactNode;
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

// Currency -> render using Intl.NumberFormat with currency from row (default EUR)
/**
 * Builds a currency column with Intl.NumberFormat rendering
 * @param opts - Column options with key and header
 * @returns Column definition
 */
function buildCurrencyColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: function Cell({ row }: { row: { original: TData } }) {
      const value = (row.original as Record<string, unknown>)[key as string];
      if (value === null || value === undefined || value === "") {
        return (
          <span className="text-primary"></span>
        ) as unknown as React.ReactNode;
      }
      const rowObj = row.original as Record<string, unknown>;
      const currencyCode = (rowObj?.currency as string) ||
        (rowObj?.currency_code as string) ||
        (rowObj?.currencyCode as string) ||
        "EUR";

      let formatted = "";
      try {
        formatted = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currencyCode,
        }).format(Number(value));
      } catch {
        formatted = String(value);
      }

      return (
        <span className="whitespace-nowrap text-sm text-primary">
          {formatted}
        </span>
      ) as unknown as React.ReactNode;
    },
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      const a = Number(rowA.getValue(columnId) ?? 0);
      const b = Number(rowB.getValue(columnId) ?? 0);
      return a - b;
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

/**
 * Builds a link column with template-based href and label
 * @param opts - Column options with key, header, href template, and label template
 * @returns Column definition
 */
function buildMaskedLinkColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
  href: string;
  cellValueMaskLabel: string;
}): ColumnDef<TData> {
  const { key, header, href, cellValueMaskLabel } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    size: 200,
    cell: function Cell({ row }: { row: { original: TData } }) {
      const rowData = row.original as Record<string, unknown>;

      // Resolve href template
      const resolvedHref = href.replace(/\{\{(.*?)\}\}/g, (_, p1) => {
        const keyPath = String(p1 || "").trim();
        const v = keyPath.includes(".")
          ? keyPath
            .split(".")
            .reduce((obj: Record<string, unknown>, k: string) =>
              (obj?.[k] as Record<string, unknown>) ?? {}, rowData)
          : rowData[keyPath];
        return encodeURIComponent(String(v ?? ""));
      });

      const resolvedLabel = cellValueMaskLabel.replace(
        /\{\{(.*?)\}\}/g,
        (_, p1) => {
          const keyPath = String(p1 || "").trim();
          const v = keyPath.includes(".")
            ? keyPath
              .split(".")
              .reduce((obj: Record<string, unknown>, k: string) =>
                (obj?.[k] as Record<string, unknown>) ?? {}, rowData)
            : rowData[keyPath];
          return String(v ?? "");
        },
      );

      return resolvedHref
        ? (
          <div className="truncate">
            <button
              type="button"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                window.location.href = resolvedHref;
              }}
              className="text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
            >
              {resolvedLabel}
            </button>
          </div>
        )
        : <span>{resolvedLabel}</span>;
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}
export const globalColumnRegistry: ColumnRegistry<Record<string, unknown>> = {
  assignees: {
    build: function buildAssigneesColumn(opts: {
      key: string;
      header?: string;
    }) {
      const { key, header } = opts;
      return {
        header: () => renderHeader(header ?? prettyString(String(key))),
        accessorKey: key as string,
        cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
          const value =
            (row.original as Record<string, unknown>)[key as string];
          const list = Array.isArray(value) ? value : [];
          return (
            <AssigneesCell
              assignees={list as Array<
                {
                  email?: string;
                  avatar?: string;
                  user_id?: string;
                  username?: string;
                  display_name?: string;
                  first_name?: string;
                  last_name?: string;
                }
              >}
            />
          );
        },
        enableSorting: false,
        size: 160,
        meta: {
          datatype: "json" as const,
          filterable: false,
        },
        column_name: key as string,
      } as ColumnDef<Record<string, unknown>>;
    },
    order: 1,
    filterable: false,
    datatype: "json",
  },
  status: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  month: {
    build: buildMonthColumn,
    datatype: "string",
    filterable: true,
  },
  view_status: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  closed: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  booking_status: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  transaction_status: {
    build: buildStatusColumn,
    order: 3,
    filterable: true,
    datatype: "string",
  },
  name: {
    build: buildBreakAllTextColumn,
    order: 1,
    filterable: true,
    datatype: "string",
  },
  invoice_description: {
    build: buildBreakAllTextColumn,
    order: 1,
    filterable: true,
    datatype: "string",
  },
  display_name: {
    build: buildBreakAllTextColumn,
    order: 1,
    filterable: true,
    datatype: "string",
  },
  invoice_total: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  balance_current: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  balance_available: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  total_excluding_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
    order: 1,
    filterable: true,
  },
  country_code: {
    build: buildCountryCodeColumn,
    datatype: "string",
    filterable: true,
  },
  home_address_country_code: {
    build: buildCountryCodeColumn,
    datatype: "string",
    filterable: true,
  },
  explanatations: {
    build: buildJsonStringColumn,
    datatype: "json",
    filterable: true,
  },
  amount_value: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  _1a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _1a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _2a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  discount_amount: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  fulfillment_status: {
    build: buildStatusColumn,
    datatype: "string",
    order: 2,
  },
  financial_status: {
    build: buildStatusColumn,
    datatype: "string",
    order: 3,
  },
  _2a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  fulfilled_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  lineitem_compare_at_price: {
    build: buildCurrencyColumn,
  },
  taxes: {
    build: buildCurrencyColumn,
  },
  refunded_amount: {
    build: buildCurrencyColumn,
  },
  risk_level: {
    build: buildStatusColumn,
  },
  shipping_country: {
    build: buildCountryCodeColumn,
  },
  shipping: {
    build: buildCurrencyColumn,
  },
  outstanding_balance: {
    build: buildCurrencyColumn,
  },
  lineitem_price: {
    build: buildCurrencyColumn,
  },
  lineitem_requires_shipping: {
    build: buildStatusColumn,
  },
  lineitem_taxable: {
    build: buildStatusColumn,
  },
  lineitem_discount: {
    build: buildCurrencyColumn,
  },
  lineitem_fulfillment_status: {
    build: buildStatusColumn,
  },
  _1b_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _1b_vat: { build: buildCurrencyColumn, datatype: "number" },
  _1c_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _1c_vat: { build: buildCurrencyColumn, datatype: "number" },
  _1d_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _1d_vat: { build: buildCurrencyColumn, datatype: "number" },
  _1e_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _3a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _3b_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _3c_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4b_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4b_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _5a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _5b_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _5g_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  invoice_total_incl_vat: {
    build: buildCurrencyColumn,
    order: 2,
    filterable: true,
    datatype: "number",
  },
  total_including_vat: { build: buildCurrencyColumn, datatype: "number" },
  total: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  amount: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  credited: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  balance: {
    build: buildCurrencyColumn,

    filterable: true,
    datatype: "number",
  },
  money_out: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  subtotal: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  tax_amount: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  amount_due: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  price: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  total_paid: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  money_in: {
    build: buildCurrencyColumn,

    filterable: true,
    datatype: "number",
  },
  closing_balance: {
    build: buildCurrencyColumn,

    filterable: true,
    datatype: "number",
  },
  debited: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  fee: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  currency: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  primary_iban: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  reference_type: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  auth_expires_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  closed_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  last_synced_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  uploaded_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  updated_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  invoice_date: { build: buildTimeColumn, filterable: true, datatype: "date" },
  invoice_due_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  last_reminded_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  accounting_start_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  time: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  created_at: {
    build: buildTimeColumn,
  },
  issue_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  paid_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  added_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  billing_country: {
    build: buildCountryCodeColumn,
  },
  started_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  contract_start_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  completed_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  due_date: {
    build: buildDayColumn,
    filterable: true,
    datatype: "date",
  },
  test_mode: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  awaiting_deletion: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  accepts_marketing: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  dpa_signed: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  consent_marketing_communications: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  onboarding_approved: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_oss: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_ioss: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_article23: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_pep_sanction: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_identity_card: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_ultimate_beneficial_owner_statement: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_business_registry_extract: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_power_of_attorney: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_source_of_wealth: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_store_status: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_source_of_funds: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  aurora_errored: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  aurora_processed: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  aurora_should_process: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  verified: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_loan: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_ar: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_ap: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_revenue: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  owns_more_than_25_percent: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_member_of_governing_board: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_expense: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_vat_payable: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_vat_receivable: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  authorize_for_automatic_acting: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_active: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_duplicate_hash: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  normalized: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  booked: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_given_authorization_for_auto_charging: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_postable: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  http: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  duration_ms: {
    build: buildDurationMsColumn,
    filterable: true,
    datatype: "number",
  },
  expires_in: {
    build: buildSecondsColumn,
    filterable: true,
    datatype: "number",
  },
  event_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  stargate_ponto_token_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  ponto_account_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  ponto_consent_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  invoice_nr: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  customer: {
    build: buildGenericColumn,
    filterable: true,
    datatype: "string",
    order: 3,
  },
  self_booking: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  accountant_is_partner_backoffice: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_overdue: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  subject_to_vat: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  allow_self_accounting: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  signed_gdpr_document: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  subject_to_reverse_vat_charge: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  closing_enabled: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  enable_search: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  reconciled: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  legal_form: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  country: {
    build: buildCountryCodeColumn,
    filterable: true,
    datatype: "string",
  },
  creditor_address_country_code: {
    build: buildCountryCodeColumn,
    filterable: true,
    datatype: "string",
  },
  transaction_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  reconciliation_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },

  document_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  booking_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  settings: {
    build: buildJsonStringColumn,
  },
  sandbox: {
    build: buildBooleanYesNoColumn,
    order: 2,
    datatype: "boolean",
    filterable: true,
  },
  reverse_charged: {
    build: buildBooleanYesNoColumn,
    datatype: "boolean",
    filterable: true,
  },
  stake_percentage: {
    build: buildPercentageColumn,
    datatype: "number",
    filterable: true,
  },
  active: {
    build: buildBooleanYesNoColumn,
    order: 1,
    datatype: "boolean",
    filterable: true,
  },
  pushed_at: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
  head_commit_timestamp: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
  enabled: {
    build: buildBooleanYesNoColumn,
    datatype: "boolean",
    filterable: true,
  },
  signed_date: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
  amount_paid: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  amount_remaining: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  paid: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
};

// Default editor configuration suggestions by column key.
// Consumers can use this to pre-fill editor types/options for common fields.
export const defaultEditorByColumn: Record<
  string,
  {
    type: "text" | "number" | "boolean" | "select";
    options?: Array<{ value: string | number | boolean; label: string }>;
  }
> = {
  status: { type: "select" },
  closed: { type: "select" },
  booking_status: { type: "select" },
  transaction_status: { type: "select" },
  currency: { type: "select" },
  country: { type: "select" },
  country_code: { type: "select" },
  reverse_charged: { type: "boolean" },
  closing_enabled: { type: "boolean" },
  verified: { type: "boolean" },
  normalized: { type: "boolean" },
  booked: { type: "boolean" },
};

/**
 * Builds TanStack Table column definitions from lean column specifications using the column registry.
 * Automatically resolves column renderers, formatters, and configurations from the registry.
 * Supports custom formatters, labels, hrefs, and view hooks for advanced rendering.
 *
 * @param specs - Array of LeanColumnSpec objects defining column behavior
 * @returns Array of TanStack Table ColumnDef objects
 *
 * @example
 * ```tsx
 * const columns = buildColumnsFromRegistry<Customer>([
 *   'name',
 *   { key: 'email', header: 'Email Address' },
 *   { key: 'status', use: 'status_badge', order: 1 }
 * ]);
 * ```
 */
export function buildColumnsFromRegistry<TData>(
  specs: Array<LeanColumnSpec<TData>>,
): ColumnDef<TData>[] {
  const built = specs.map((spec) => {
    const key = (typeof spec === "object" ? spec.key : spec) as keyof TData;
    const header = typeof spec === "object" ? spec.header : undefined;
    const useName = typeof spec === "object" ? spec.use : undefined;
    const specOrder = typeof spec === "object" ? spec.order : undefined;
    const minWidth = typeof spec === "object" ? spec.minWidth : undefined;
    const maxWidth = typeof spec === "object" ? spec.maxWidth : undefined;
    const widthFit = typeof spec === "object" ? spec.widthFit : undefined;
    const enableNoSelect = typeof spec === "object"
      ? spec.enableNoSelect
      : undefined;
    const enableNoWrap = typeof spec === "object"
      ? spec.enableNoWrap
      : undefined;
    const labelTemplate = typeof spec === "object" ? spec.label : undefined;
    const href = typeof spec === "object" ? spec.href : undefined;
    const cellValueMaskLabel = typeof spec === "object"
      ? spec.cell_value_mask_label
      : undefined;
    const formatter = typeof spec === "object" ? spec.formatter : undefined;
    const viewHook = typeof spec === "object" ? spec.viewHook : undefined;
    const viewRender = typeof spec === "object" ? spec.viewRender : undefined;
    const editorCfg = typeof spec === "object" ? spec.editor : undefined;

    const registryKeyRaw = (useName ?? String(key)).toLowerCase();
    // Support registry keys that cannot start with a number by allowing
    // fallback between "1a_turnover" <-> "_1a_turnover"
    let renderer = (globalColumnRegistry as ColumnRegistry<TData>)[
      registryKeyRaw
    ];
    if (!renderer) {
      // If key starts with a number, try with a leading underscore
      if (/^\d/.test(registryKeyRaw)) {
        renderer = (globalColumnRegistry as ColumnRegistry<TData>)[
          `_${registryKeyRaw}`
        ];
      }
    }
    if (!renderer) {
      if (
        registryKeyRaw.startsWith("_") &&
        /^\d/.test(registryKeyRaw.slice(1))
      ) {
        renderer = (globalColumnRegistry as ColumnRegistry<TData>)[
          registryKeyRaw.slice(1)
        ];
      }
    }

    const typedKey = key as Extract<keyof TData, string | number>;
    const shouldUseMaskedLink = href && cellValueMaskLabel;
    const colDef = (
      shouldUseMaskedLink
        ? buildMaskedLinkColumn<TData>({
          key: typedKey,
          header,
          href,
          cellValueMaskLabel,
        })
        : renderer
        ? renderer.build({ key: typedKey, header })
        : buildGenericColumn<TData>({ key: typedKey, header })
    ) as ColumnDef<TData> & {
      size?: number;
      minSize?: number;
      maxSize?: number;
      meta?: { className?: string } & {
        widthFit?: boolean;
        maxWidth?: number;
        labelTemplate?: string;
        headerText?: string;
      };
    };

    let computedHeaderText = (typeof header === "string" && header) ||
      prettyString(String(key));
    if (typeof minWidth === "number") {
      colDef.minSize = minWidth;
      colDef.size = colDef.size ?? minWidth;
    }
    if (typeof maxWidth === "number") {
      colDef.maxSize = maxWidth;
      colDef.meta = { ...(colDef.meta as Record<string, unknown>), maxWidth };
    }
    if (widthFit) {
      colDef.meta = {
        ...(colDef.meta as Record<string, unknown>),
        widthFit: true,
      };
    }
    // Apply optional no-select / no-wrap classes via meta.className
    if (enableNoSelect || enableNoWrap) {
      const existingClass = (colDef.meta as Record<string, unknown>)
        ?.className as
          | string
          | undefined;
      const parts: string[] = [];
      if (existingClass) parts.push(existingClass);
      if (enableNoSelect) parts.push("select-none");
      if (enableNoWrap) parts.push("whitespace-nowrap");
      colDef.meta = {
        ...(colDef.meta as Record<string, unknown>),
        className: parts.join(" "),
      };
    }
    if (labelTemplate) {
      // use label as header text when provided
      const headerText = String(labelTemplate);
      colDef.header = () => renderHeader(headerText);
      computedHeaderText = headerText;
    }

    if (cellValueMaskLabel && !href) {
      const template = String(cellValueMaskLabel);
      const OriginalCell = colDef.cell;
      colDef.cell = ({ row }: { row: { original: TData } }) => {
        const rowData = row.original as Record<string, unknown>;
        const resolvedLabel = template.replace(/\{\{(.*?)\}\}/g, (_, p1) => {
          const keyPath = String(p1 || "").trim();
          const v = keyPath.includes(".")
            ? keyPath
              .split(".")
              .reduce((obj: Record<string, unknown>, k: string) =>
                (obj?.[k] as Record<string, unknown>) ?? {}, rowData)
            : rowData[keyPath];
          return String(v ?? "");
        });
        return (
          <span className="truncate text-primary">{resolvedLabel}</span>
        ) as unknown as React.ReactNode;
      };
    }
    colDef.meta = {
      ...(colDef.meta as Record<string, unknown>),
      headerText: computedHeaderText,
    };
    if (editorCfg) {
      (colDef.meta as Record<string, unknown>).editor = editorCfg;
    }
    if (formatter) {
      const originalCell = colDef.cell;
      colDef.cell = ({ row }: { row: { original: TData } }) => {
        const rowObj = row.original as Record<string, unknown>;
        const value = rowObj[key as string];
        const formatted = formatter(value, row.original);

        if (formatted === null || formatted === undefined) {
          return originalCell
            ? (originalCell as (
              props: { row: { original: TData } },
            ) => React.ReactNode)({ row })
            : defaultTextCell<TData>(key)({ row });
        }
        return formatted as unknown as React.ReactNode;
      };
    }
    if (typeof viewHook === "function") {
      const OriginalCell = colDef.cell;
      const HookCell: React.FC<{ row: { original: TData } }> = ({ row }) => {
        // call user-provided hook
        const result = viewHook(row.original);
        if (typeof viewRender === "function") {
          return viewRender(result, row.original) as React.ReactNode;
        }
        return OriginalCell
          ? (
            <>
              {(OriginalCell as (
                props: { row: { original: TData } },
              ) => React.ReactNode)({ row })}
            </>
          )
          : (
            <>
              {String(
                (row.original as Record<string, unknown>)[key as string] ?? "",
              )}
            </>
          );
      };
      HookCell.displayName = `HookCell_${String(key)}`;
      colDef.cell = (ctx: { row: { original: TData } }) => (
        <HookCell {...ctx} />
      );
    }
    const order = specOrder !== undefined
      ? specOrder
      : renderer && typeof renderer.order === "number"
      ? renderer.order
      : Number.POSITIVE_INFINITY;

    return { def: colDef as ColumnDef<TData>, order };
  });

  built.sort((a, b) => a.order - b.order);
  return built.map((b) => b.def);
}
