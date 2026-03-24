"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useReactTable, flexRender } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LeanTableTitleSize = "default" | "sm" | "md" | "lg";

export interface LeanTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  title?: string;
  disableFullscreenView?: boolean;
  onAddItemAction?: () => void;
  addItemLabel?: string;
  hrefAction?: (row: TData) => string | undefined;
  filterColumn?: string | undefined;
  filterColumns?: string[];
  filterPlaceholder?: string;
  defaultSorting?: Array<{ id: string; desc?: boolean }>;
  displayContext?: string;
  displayConfig?: unknown;
  allowDownloadCsv?: boolean;
  forceWrappingHeaderLabels?: boolean;
  [key: string]: unknown;
}

export function LeanTable<TData>({
  columns,
  data,
  title,
  onAddItemAction,
  addItemLabel,
  hrefAction,
  filterPlaceholder,
}: LeanTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");

  const filteredData = useMemo(() => {
    if (!globalFilter) return data;
    const needle = globalFilter.toLowerCase();
    return data.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(needle),
    );
  }, [data, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: () => ({
      rows: filteredData.map((row, rowIndex) => ({
        id: String(rowIndex),
        original: row,
        getVisibleCells: () =>
          columns.map((column) => ({
            id: column.id ?? "",
            column,
            getContext: () => ({ row, column }),
          })),
      })),
    }),
  } as any);

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {onAddItemAction && addItemLabel && (
            <Button onClick={onAddItemAction}>{addItemLabel}</Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <input
          type="search"
          placeholder={filterPlaceholder || "Search..."}
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="rounded-sm border border-input bg-card px-3 py-1 text-sm text-foreground focus:border-ring focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="overflow-auto rounded-md border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn("whitespace-nowrap px-3 py-2 text-left")}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer hover:bg-accent"
                onClick={() => {
                  if (hrefAction) {
                    const href = hrefAction(row.original as TData);
                    if (href) {
                      window.location.href = href;
                    }
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 text-foreground"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
