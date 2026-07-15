"use client";

import {
  AthenaTable,
  type AthenaTableColumn,
} from "@xylex-group/athena-auth-ui/tables";
import { Button, Input, Link } from "@heroui/react";
import { flexRender, type ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import type { TableColumnMeta } from "../../resource-types";

export type AthenaResourceTableTitleSize = "default" | "sm" | "md" | "lg";

export interface AthenaResourceTableProps<Row extends Record<string, unknown>> {
  addItemLabel?: string;
  addResourceButton?: ReactNode;
  className?: string;
  columns: ColumnDef<Row>[];
  data: Row[];
  defaultSorting?: Array<{ id: string; desc?: boolean }>;
  filterColumn?: string;
  filterColumns?: string[];
  hideTopControls?: boolean;
  hrefAction?: (row: Row) => string | undefined;
  isLoading?: boolean;
  onAddItemAction?: () => void;
  rowsPerPage?: number;
  title?: string;
  titleSize?: AthenaResourceTableTitleSize;
  [key: string]: unknown;
}

function columnId<Row>(column: ColumnDef<Row>, index: number): string {
  const candidate = column as ColumnDef<Row> & { accessorKey?: string; id?: string };
  return candidate.accessorKey ?? candidate.id ?? `column-${index}`;
}

function columnLabel<Row>(column: ColumnDef<Row>, id: string): ReactNode {
  const metadata = column.meta as TableColumnMeta | undefined;
  if (metadata?.headerText) return metadata.headerText;
  if (typeof column.header === "string") return column.header;
  return id.replace(/_/g, " ");
}

function renderCell<Row extends Record<string, unknown>>(
  column: ColumnDef<Row>,
  id: string,
  row: Row,
  rowIndex: number,
): ReactNode {
  if (!column.cell) return String(row[id] ?? "");

  const rowContext = {
    id: String(rowIndex),
    index: rowIndex,
    original: row,
    getValue: (key: string) => row[key],
  };
  return flexRender(column.cell, {
    cell: {},
    column: { id, columnDef: column },
    getValue: () => row[id],
    renderValue: () => row[id] ?? null,
    row: rowContext,
    table: {},
  } as never);
}

function compareValues(left: unknown, right: unknown): number {
  if (left == null) return right == null ? 0 : 1;
  if (right == null) return -1;
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function AthenaResourceTable<Row extends Record<string, unknown>>({
  addItemLabel,
  addResourceButton,
  className,
  columns,
  data,
  defaultSorting,
  filterColumn,
  filterColumns,
  hideTopControls,
  hrefAction,
  isLoading,
  onAddItemAction,
  rowsPerPage = 25,
  title,
  titleSize = "default",
}: AthenaResourceTableProps<Row>) {
  const [search, setSearch] = useState("");
  const searchableColumns = filterColumns?.length
    ? filterColumns
    : filterColumn
      ? [filterColumn]
      : undefined;

  const rows = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    const filtered = needle
      ? data.filter((row) => {
          const values = searchableColumns?.length
            ? searchableColumns.map((key) => row[key])
            : Object.values(row);
          return values.some((value) =>
            String(value ?? "").toLocaleLowerCase().includes(needle),
          );
        })
      : [...data];

    const initialSort = defaultSorting?.[0];
    if (!initialSort) return filtered;
    return filtered.sort((left, right) => {
      const result = compareValues(left[initialSort.id], right[initialSort.id]);
      return initialSort.desc ? -result : result;
    });
  }, [data, defaultSorting, search, searchableColumns]);

  const athenaColumns = useMemo<AthenaTableColumn<Row>[]>(
    () =>
      columns.map((column, index) => {
        const id = columnId(column, index);
        const isPrimary = index === 0;
        return {
          id,
          isRowHeader: isPrimary,
          isSortable: id !== "actions",
          label: columnLabel(column, id),
          mobileRole: id === "actions" ? "action" : isPrimary ? "title" : "detail",
          render: (row, rowIndex) => {
            const content = renderCell(column, id, row, rowIndex);
            const href = isPrimary ? hrefAction?.(row) : undefined;
            return href ? (
              <Link className="rounded-lg font-medium" href={href}>
                {content}
              </Link>
            ) : content;
          },
          valueKey: id,
        };
      }),
    [columns, hrefAction],
  );

  const titleClassName = {
    default: "text-xl",
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  }[titleSize];
  const addAction = addResourceButton ??
    (onAddItemAction && addItemLabel ? (
      <Button onPress={onAddItemAction}>{addItemLabel}</Button>
    ) : undefined);

  return (
    <div className={className}>
      {title ? <h2 className={`${titleClassName} mb-3 font-semibold`}>{title}</h2> : null}
      <AthenaTable
        ariaLabel={title ?? "Resources"}
        columns={athenaColumns}
        defaultRowsPerPage={rowsPerPage}
        desktopBreakpoint="auto"
        emptyState={() => "No resources found."}
        getRowKey={(row, index) => String(row.id ?? row.uuid ?? index)}
        isLoading={isLoading}
        rows={rows}
        tableId={title ?? "resources"}
        topContent={hideTopControls ? undefined : (
          <div className="w-full sm:max-w-sm">
            <Input
              aria-label={`Search ${title ?? "resources"}`}
              className="rounded-lg border border-input bg-background"
              name="resource-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        )}
        topRightActions={addAction}
      />
    </div>
  );
}
