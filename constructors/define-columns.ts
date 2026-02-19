"use client";

import type {
  BuiltColumnSpec,
  DataSourceRef,
  ResourceFieldSpec,
} from "../resource-types";
import { defaultEditorByColumn } from "./column-registry";
import { getDrizzleColumnInfo } from "@/packages/resource-framework/utils/drizzle-editor";

/**
 * Builds column specifications compatible with ResourceRoute.columns from high-level field specs.
 * Maps field_type, options, and data_source into the editable shape used by table views.
 * Falls back to defaults from column-registry when field_type is omitted.
 * Automatically deduplicates based on column_name, keeping the first occurrence.
 *
 * @param specs - Array of ResourceFieldSpec objects defining column behavior
 * @returns Array of BuiltColumnSpec objects ready for use in resource routes
 *
 * @example
 * ```tsx
 * const columns = defineColumns([
 *   { column_name: 'name', field_type: 'text', order: 1 },
 *   { column_name: 'status', field_type: 'select', options: [...] }
 * ]);
 * ```
 */
export function defineColumns(specs: ResourceFieldSpec[]): BuiltColumnSpec[] {
  const seen = new Set<string>();
  const deduped = specs.filter((s) => {
    if (seen.has(s.column_name)) return false;
    seen.add(s.column_name);
    return true;
  });

  return deduped.map((s) => {
    const fallbackEditor = defaultEditorByColumn[s.column_name];
    const editorMeta = (s as { editor?: { data_source?: DataSourceRef } }).editor;
    const editableMeta = (s as { editable?: { data_source?: DataSourceRef } })
      .editable;
    const candidateType = typeof s.field_type !== "undefined"
      ? s.field_type
      : fallbackEditor?.type;

    let resolvedEditorType: "text" | "boolean" | "select" | "textarea" | undefined;
    switch (candidateType) {
      case "select":
        resolvedEditorType = "select";
        break;
      case "boolean":
        resolvedEditorType = "boolean";
        break;
      case "text":
      case "number":
      case "date":
        resolvedEditorType = "text";
        break;
      case "textarea":
        resolvedEditorType = "textarea";
        break;
      default:
        resolvedEditorType = undefined;
    }

    const resolvedDataSource = editorMeta?.data_source ??
      editableMeta?.data_source ??
      s.data_source;

    const editable = resolvedEditorType
      ? {
        type: resolvedEditorType,
        update_table: s.update_table,
        update_id_column: s.update_id_column,
        update_column: s.update_column,
        options: s.options,
        data_source: resolvedDataSource,
      }
      : undefined;

    const info = getDrizzleColumnInfo(undefined, s.column_name);
    return {
      column_name: s.column_name,
      header: s.header,
      header_label: s.header_label,
      data_type: info.dataType ?? s.data_type,
      use: s.use,
      order: s.order,
      href: s.href,
      hidden: s.hidden,
      label: s.label,
      category: s.category,
      cell_value_mask_label: s.cell_value_mask_label,
      formatter: s.formatter,
      minWidth: s.minWidth,
      maxWidth: s.maxWidth,
      widthFit: s.widthFit,
      editable,
    };
  });
}
