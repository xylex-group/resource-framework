"use client";

import type { TableWidgetCondition } from "../resource-types";
import { resolveTemplateValue } from "../templating";
import type { TemplateContext } from "../templating/types";

/**
 * @deprecated Use resolveTemplateValue from the templating module instead.
 * This function is kept for backward compatibility.
 */
export function interpolateWidgetValue(
  value: string | number | boolean | null,
  entity: Record<string, unknown>,
  user?: Record<string, unknown>,
): string | number | boolean | null {
  const context: TemplateContext = {
    entity,
    user: user || {},
  };
  return resolveTemplateValue(value, context) as string | number | boolean | null;
}

export function buildWidgetConditions(
  props?: { conditions?: TableWidgetCondition[] },
  entity?: Record<string, unknown>,
  user?: Record<string, unknown>,
): TableWidgetCondition[] {
  const base: TableWidgetCondition[] = [];

  if (props?.conditions && entity) {
    const context: TemplateContext = {
      entity,
      user: user || {},
    };

    for (const condition of props.conditions) {
      const interpolatedValue = resolveTemplateValue(condition.eq_value, context);
      if (interpolatedValue === undefined) continue;
      base.push({
        eq_column: condition.eq_column,
        eq_value: interpolatedValue as string | number | boolean | null,
      });
    }
  }

  if (entity) {
    const hasOrganizationFilter = base.some(
      (c) => c.eq_column === "organization_id",
    );
    const organizationId =
      entity.organization_id ?? entity.organizationId;
    if (!hasOrganizationFilter && organizationId !== undefined) {
      base.unshift({
        eq_column: "organization_id",
        eq_value: organizationId as string | number | boolean | null,
      });
    }
  }

  return base;
}
