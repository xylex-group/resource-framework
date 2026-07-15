"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ColumnRegistry, LeanColumnSpec } from "../resource-types";
import { globalColumnRegistry } from "./column-registry-definitions";
import { prettyString } from "@/lib/format/string";
import {
  buildGenericColumn,
  buildMaskedLinkColumn,
  defaultTextCell,
  renderHeader,
} from "./column-builders";

export { STATUS_SORT_ORDER } from "./column-builders";
export { globalColumnRegistry } from "./column-registry-definitions";

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
