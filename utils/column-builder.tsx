import type { ColumnDef } from "@tanstack/react-table";
import { PriorityIcon } from "@/components/icons";
import { ScopeCell } from "../components/cells/ScopeCell";
import {
  buildColumnsFromRegistry,
  type LeanColumnSpec,
} from "../constructors/column-registry";
import { getPriorityLabel, stringPriorityToNumber } from "./priority";
import type { ResourceRoute } from "../resource-types";

/**
 * Builds table columns from resource configuration and data
 * @param data - Array of data rows to build columns from
 * @param resource - Resource route configuration
 * @returns Array of TanStack Table ColumnDef objects
 */
export const buildTableColumns = <TData extends Record<string, unknown>>(
  data: TData[] | undefined,
  resource: ResourceRoute | null,
): ColumnDef<TData>[] => {
  const first = Array.isArray(data) && data.length > 0 ? data[0] : null;
  const configured = resource?.columns;
  const hasConfigured = Array.isArray(configured) && configured.length > 0;

  const specs: Array<LeanColumnSpec<TData>> = (
    hasConfigured
      ? (configured as Array<string | Record<string, unknown>>)
        .filter((c) => !(typeof c === "object" && c?.hidden))
        .map((c) =>
          typeof c === "string" ? { key: c, header: c.replace(/_/g, " ") } : {
            key: c.column_name as string,
            header: (c.header_label as string) ||
              (c.header as string) ||
              (c.column_name as string).replace(/_/g, " "),
            use: c.use as string | undefined,
            label: c.label as string | undefined,
            href: c.href as string | undefined,
            cell_value_mask_label: c.cell_value_mask_label as
              | string
              | undefined,
            order: c.order as number | undefined,
            formatter: c.formatter as string | undefined,
            minWidth: c.minWidth as number | undefined,
            maxWidth: c.maxWidth as number | undefined,
            widthFit: c.widthFit as boolean | undefined,
          }
        )
      : (first ? Object.keys(first) : []).map((k) => ({
        key: k,
        header: k.replace(/_/g, " "),
      }))
  ) as Array<LeanColumnSpec<TData>>;

  const finalSpecs = Array.isArray(specs) && specs.length > 0
    ? specs
    : ((first ? Object.keys(first) : []).map((k) => ({
      key: k,
      header: k.replace(/_/g, " "),
    })) as Array<LeanColumnSpec<TData>>);

  const built = buildColumnsFromRegistry<TData>(finalSpecs);
  const columnsWithIds = built.filter((col) => {
    const colDef = col as ColumnDef<TData> & {
      accessorKey?: string;
      id?: string;
    };
    const key = colDef.accessorKey ?? colDef.id;
    return typeof key === "string" && key.trim().length > 0;
  });

  const builtWithScope = columnsWithIds.map((col) => {
    const colWithKey = col as ColumnDef<TData> & {
      accessorKey?: string;
      id?: string;
    };
    const key = colWithKey.accessorKey || colWithKey.id;
    if (key === "scope" || key === "entity_type") {
      return {
        ...col,
        cell: ({ row }: { row: { original: TData } }) => (
          <ScopeCell scope={row.original?.[key] as string | null | undefined} />
        ),
      } as ColumnDef<TData>;
    }
    if (key === "priority") {
      return {
        ...col,
        cell: ({ row }: { row: { original: TData } }) => {
          const raw = row.original?.priority;
          const num = stringPriorityToNumber(raw);
          return (
            <div className="inline-flex items-center gap-2">
              <PriorityIcon priority={num} width={14} height={14} />
              <span className="text-xs font-medium text-primary">
                {getPriorityLabel(num)}
              </span>
            </div>
          );
        },
      } as ColumnDef<TData>;
    }
    return col;
  });

  const filterableMeta: Record<
    string,
    { filterable?: boolean; datatype?: string }
  > = {};
  const blacklist = new Set(resource?.filterableColumnBlacklist || []);
  builtWithScope.forEach((col) => {
    const colWithKey = col as ColumnDef<TData> & {
      accessorKey?: string;
      id?: string;
    };
    const key = colWithKey.accessorKey || colWithKey.id;
    if (!key) return;
    const meta = (col?.meta as Record<string, unknown>) || {};
    const isBlacklisted = blacklist.has(key);
    filterableMeta[key] = {
      filterable: isBlacklisted ? false : Boolean(meta.filterable),
      datatype: meta.datatype as string | undefined,
    };
  });

  try {
    (window as unknown as Record<string, unknown>).__filterableMeta =
      filterableMeta;
  } catch {}

  const filteredColumns = Array.isArray(data) && data.length > 0
    ? builtWithScope.filter((col) => {
      const colWithKey = col as ColumnDef<TData> & { accessorKey?: string };
      const key = colWithKey.accessorKey;
      if (!key) return true;
      return data.some((row) => row?.[key] != null);
    })
    : builtWithScope;

  return filteredColumns;
};
