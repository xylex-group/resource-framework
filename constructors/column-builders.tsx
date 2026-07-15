"use client";
import type { ColumnDef, HeaderContext, Row } from "@tanstack/react-table";
import type React from "react";
import { Flag } from "@/components/ui/flag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatUnixSecondsToDate,
  formatUnixSecondsToMonthDayTime,
} from "@/lib/date-utils";
import { prettyString } from "@/lib/format/string";

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
export const defaultTextCell = <TData,>(key: keyof TData) => {
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
export function renderHeader(header: string) {
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
export function buildMonthColumn<TData>(opts: {
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
export function buildStatusColumn<TData>(opts: {
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
export function buildPercentageColumn<TData>(
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
export function buildTimeColumn<TData>(opts: {
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
export function buildDayColumn<TData>(opts: {
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
export function buildBooleanYesNoColumn<TData>(opts: {
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
export function buildCountryCodeColumn<TData>(opts: {
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
export function buildDurationMsColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(_ctx: HeaderContext<TData, unknown>) {
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
export function buildSecondsColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(_ctx: HeaderContext<TData, unknown>) {
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
export function buildBreakAllTextColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(_ctx: HeaderContext<TData, unknown>) {
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
export function buildJsonStringColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(_ctx: HeaderContext<TData, unknown>) {
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
export function buildGenericColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(_ctx: HeaderContext<TData, unknown>) {
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
export function buildUppercaseColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(_ctx: HeaderContext<TData, unknown>) {
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
export function buildCurrencyColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(_ctx: HeaderContext<TData, unknown>) {
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
export function buildMaskedLinkColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
  href: string;
  cellValueMaskLabel: string;
}): ColumnDef<TData> {
  const { key, header, href, cellValueMaskLabel } = opts;
  return {
    header: function Header(_ctx: HeaderContext<TData, unknown>) {
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
            <Button
              type="button"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                window.location.href = resolvedHref;
              }}
              className="text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
            >
              {resolvedLabel}
            </Button>
          </div>
        )
        : <span>{resolvedLabel}</span>;
    },
    column_name: key as string,
  } as unknown as ColumnDef<TData>;
}

