import type { TemplateStrategy, TemplateContext } from "../types";
import { getValueByKeyCase, getValueByPathCase } from "../../utils/key-case";

/**
 * Strategy for resolving direct column references.
 * This is the fallback strategy for unprefixed templates like {{customer_id}}.
 *
 * Behavior:
 * - Checks if the key exists in context.columns (if provided)
 * - Resolves from context.entity using case-insensitive lookup
 * - Supports nested paths (e.g., address.city)
 * - Always attempts resolution even if columns list is not provided
 *
 * Examples:
 * - {{customer_id}} resolves to entity.customer_id
 * - {{organizationId}} resolves to entity.organization_id (case-insensitive)
 * - {{address.city}} resolves to entity.address.city (nested)
 */
export class ColumnStrategy implements TemplateStrategy {
  resolve(key: string, context: TemplateContext): unknown {
    if (!context.entity) {
      return undefined;
    }

    // If columns list is provided, optionally check if key is in the list
    // (But we'll still attempt resolution even if not in list for flexibility)
    if (context.columns && context.columns.length > 0) {
      const normalizedKey = key.toLowerCase();
      const hasColumn = context.columns.some(
        (col) => col.toLowerCase() === normalizedKey,
      );

      if (!hasColumn && context.custom?.strictColumnCheck) {
        return undefined;
      }
    }

    if (key.includes(".")) {
      return getValueByPathCase(context.entity, key);
    }
    return getValueByKeyCase(context.entity, key);
  }
}
