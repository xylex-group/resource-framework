/**
 * Template System
 *
 * A unified, extensible template resolution system with strategy-based resolvers.
 * Supports multiple prefixes: env, user, resource, and direct column references.
 *
 * @example
 * ```typescript
 * import { resolveTemplate, initializeTemplating } from './templating';
 *
 * // Initialize the system (registers all strategies)
 * initializeTemplating();
 *
 * // Resolve a template
 * const result = resolveTemplate(
 *   "{{user.organization_id}}/{{resource_id}}",
 *   {
 *     user: { organization_id: "org-123" },
 *     entity: { customer_id: "cust-456" },
 *     idColumn: "customer_id"
 *   }
 * );
 * // result = "org-123/cust-456"
 * ```
 */

export * from "./types";
export * from "./registry";
export * from "./resolver";
export * from "./strategies";

import { registerStrategy } from "./registry";
import {
  EnvStrategy,
  UserStrategy,
  ResourceStrategy,
  ResourceIdShorthandStrategy,
  ColumnStrategy,
} from "./strategies";

/**
 * Initialize the templating system by registering all default strategies.
 * Call this once at application startup.
 */
export function initializeTemplating(): void {
  registerStrategy("env", new EnvStrategy());
  registerStrategy("user", new UserStrategy());
  registerStrategy("resource", new ResourceStrategy());
  registerStrategy("resource_id", new ResourceIdShorthandStrategy());

  // Note: ColumnStrategy is used as fallback, not registered with a prefix
}

// Auto-initialize on import (can be disabled by clearing registry)
initializeTemplating();
