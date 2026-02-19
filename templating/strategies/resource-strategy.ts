import type { TemplateStrategy, TemplateContext } from "../types";
import { getValueByKeyCase } from "../../utils/key-case";

/**
 * Strategy for resolving resource-related values.
 * Resolves templates like {{resource.id}} or {{resource_id}} from context.entity.
 *
 * Special handling:
 * - {{resource.id}} resolves to context.entity[context.idColumn]
 * - {{resource_id}} (without prefix) is a shorthand that also resolves to the ID
 * - {{resource.customer_id}} resolves to context.entity.customer_id
 */
export class ResourceStrategy implements TemplateStrategy {
  resolve(key: string, context: TemplateContext): unknown {
    if (!context.entity) {
      return undefined;
    }

    // Special case: {{resource.id}} resolves to the ID column
    if (key === "id" && context.idColumn) {
      return getValueByKeyCase(context.entity, context.idColumn);
    }

    // Otherwise, resolve the key from the entity using case-insensitive lookup
    return getValueByKeyCase(context.entity, key);
  }
}

/**
 * Special strategy for handling {{resource_id}} shorthand.
 * This is registered separately and resolves directly to the ID column value.
 */
export class ResourceIdShorthandStrategy implements TemplateStrategy {
  resolve(_key: string, context: TemplateContext): unknown {
    if (!context.entity || !context.idColumn) {
      return undefined;
    }

    return getValueByKeyCase(context.entity, context.idColumn);
  }
}
