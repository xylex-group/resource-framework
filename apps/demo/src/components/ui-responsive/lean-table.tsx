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
  filterColumns,
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
          <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
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
          className="rounded-sm border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="overflow-auto rounded-md border border-slate-800 bg-slate-950/60">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
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
          <tbody className="divide-y divide-slate-800">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer hover:bg-slate-900"
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
                    className="px-3 py-2 text-slate-100"
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
