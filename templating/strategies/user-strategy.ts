import type { TemplateStrategy, TemplateContext } from "../types";
import { getValueByPathCase } from "../../utils/key-case";

/**
 * Strategy for resolving user-related values.
 * Resolves templates like {{user.organization_id}} from context.user.
 *
 * Supports nested paths with case-insensitive lookup:
 * - {{user.organization_id}} or {{user.organizationId}}
 * - {{user.profile.name}}
 */
export class UserStrategy implements TemplateStrategy {
  resolve(key: string, context: TemplateContext): unknown {
    if (!context.user) {
      return undefined;
    }
    return getValueByPathCase(context.user, key);
  }
}
