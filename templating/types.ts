/**
 * Context provided to template strategies for resolving values.
 */
export interface TemplateContext {
  /** The current entity/row data being templated */
  entity?: Record<string, unknown>;
  
  /** User information (organization_id, user_id, etc.) */
  user?: Record<string, unknown>;
  
  /** The ID column name of the current resource (e.g., 'customer_id') */
  idColumn?: string;
  
  /** List of available column names in the current resource */
  columns?: string[];
  
  /** Resource name (e.g., 'customers', 'invoices') */
  resourceName?: string;
  
  /** Whitelist of allowed environment variables (for security) */
  allowedEnvVars?: string[];
  
  /** Additional custom data that strategies can access */
  custom?: Record<string, unknown>;
}

/**
 * Strategy interface for resolving template values.
 * Each strategy handles a specific prefix (env, user, resource, etc.)
 */
export interface TemplateStrategy {
  /**
   * Resolve a template key to its value.
   * 
   * @param key - The key to resolve (e.g., 'organization_id' for {{user.organization_id}})
   * @param context - The template context containing all available data
   * @returns The resolved value, or undefined if not found
   */
  resolve(key: string, context: TemplateContext): unknown;
}

/**
 * Options for template resolution behavior.
 */
export interface TemplateOptions {
  /** If true, return primitive types; if false, always return strings */
  preserveTypes?: boolean;
  
  /** Value to use when a template cannot be resolved */
  defaultValue?: unknown;
  
  /** If true, throw errors on resolution failures; if false, return defaultValue */
  strict?: boolean;
  
  /** If true, log warnings for unresolved templates */
  logWarnings?: boolean;
  
  /** Custom type coercion function */
  coerce?: (value: unknown) => unknown;
}

/**
 * Result of parsing a template token.
 */
export interface ParsedToken {
  /** The full token match including braces: {{user.id}} */
  fullMatch: string;
  
  /** The content inside braces: user.id */
  content: string;
  
  /** The prefix (strategy name): user */
  prefix?: string;
  
  /** The key after the prefix: id (or full content if no prefix) */
  key: string;
}
