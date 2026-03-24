import type { ColumnMeta } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    widthFit?: boolean;
    headerText?: string;
  }
}
import type { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue = unknown> {
    filterable?: boolean;
    className?: string;
    datatype?: string;
  }
}

