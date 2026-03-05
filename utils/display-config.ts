import type { ColumnDef } from "@tanstack/react-table";
import type { TableColumnMeta, TableRowData } from "../resource-types";
import { prettyString } from "./string";

type DisplayConfigItem =
  | {
    label: string;
    value: string;
    type: "toggle";
  }
  | {
    label: string;
    value: string;
    type: "sort";
    options: Array<{ label: string; value: string }>;
  }
  | {
    label: string;
    value: string;
    type: "rows_per_page";
    options: Array<{ label: string; value: string }>;
    defaultValue: string;
  };

/**
 * Generates display configuration for table columns including toggles, sort options, and pagination
 * @param columns - Array of column definitions
 * @returns Array of display configuration items
 */
export const generateDisplayConfig = (
  columns: Array<ColumnDef<TableRowData>>,
): DisplayConfigItem[] => {
  const cols = (columns || []).map((column) => {
    const c = column as ColumnDef<TableRowData> & {
      accessorKey?: string;
      id?: string;
      header?: unknown;
      meta?: TableColumnMeta;
    };
    const accessor = c.accessorKey ?? c.id;
    const headerText = c.meta?.headerText;
    const header = c.header;
    const label = (typeof headerText === "string" && headerText) ||
      (typeof header === "string"
        ? header
        : prettyString(String(accessor ?? "field")));
    return {
      label,
      value: `show_${String(accessor)}`,
      type: "toggle" as const,
    };
  });

  const sortOptions = (columns || [])
    .filter((column) => {
      const c = column as { enableSorting?: boolean };
      return c.enableSorting !== false;
    })
    .flatMap((column) => {
      const c = column as ColumnDef<TableRowData> & {
        accessorKey?: string;
        id?: string;
        header?: unknown;
        meta?: TableColumnMeta;
      };
      const accessor = c.accessorKey ?? c.id;
      const headerText = c.meta?.headerText;
      const header = c.header;
      const label = (typeof headerText === "string" && headerText) ||
        (typeof header === "string"
          ? header
          : prettyString(String(accessor ?? "field")));
      return [
        { label: `${label} (A-Z/asc)`, value: `${String(accessor)}_asc` },
        { label: `${label} (Z-A/desc)`, value: `${String(accessor)}_desc` },
      ];
    });

  return [
    ...cols,
    ...(sortOptions?.length
      ? ([
        {
          label: "Sort by",
          value: "sort_by",
          type: "sort" as const,
          options: sortOptions,
        },
      ] as const)
      : []),
    {
      label: "Items per page",
      value: "rows_per_page",
      type: "rows_per_page" as const,
      options: [
        { label: "10 rows", value: "10" },
        { label: "25 rows", value: "25" },
        { label: "50 rows", value: "50" },
        { label: "100 rows", value: "100" },
        { label: "1000 rows", value: "1000" },
      ],
      defaultValue: "25",
    },
  ];
};
