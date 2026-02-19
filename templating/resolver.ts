import type { TemplateContext, TemplateOptions, ParsedToken } from "./types";
import { getStrategy } from "./registry";
import { ColumnStrategy } from "./strategies/column-strategy";

// Template regex to match {{tokens}}
const TEMPLATE_REGEX = /\{\{(.*?)\}\}/g;

// Fallback strategy for unprefixed templates
const fallbackStrategy = new ColumnStrategy();

/**
 * Parse a template token to extract prefix and key.
 * 
 * @param content - The content inside braces (e.g., "user.organization_id")
 * @returns Parsed token information
 */
function parseToken(content: string): ParsedToken {
  const trimmed = content.trim();
  
  // Check for special case: resource_id shorthand
  if (trimmed === "resource_id") {
    return {
      fullMatch: `{{${content}}}`,
      content: trimmed,
      prefix: "resource_id",
      key: "",
    };
  }
  
  // Check for prefix (text before first dot)
  const dotIndex = trimmed.indexOf(".");
  if (dotIndex > 0) {
    const prefix = trimmed.substring(0, dotIndex);
    const key = trimmed.substring(dotIndex + 1);
    return {
      fullMatch: `{{${content}}}`,
      content: trimmed,
      prefix,
      key,
    };
  }
  
  // No prefix found
  return {
    fullMatch: `{{${content}}}`,
    content: trimmed,
    prefix: undefined,
    key: trimmed,
  };
}

/**
 * Coerce a resolved value to the appropriate type.
 * 
 * @param value - The value to coerce
 * @param options - Template options
 * @returns Coerced value
 */
function coerceValue(value: unknown, options?: TemplateOptions): unknown {
  // Use custom coercion if provided
  if (options?.coerce) {
    return options.coerce(value);
  }
  
  // If preserveTypes is false, always return string
  if (options?.preserveTypes === false) {
    return value === null || value === undefined ? "" : String(value);
  }
  
  // Default: preserve types
  return value;
}

/**
 * Resolve a single template token.
 * 
 * @param token - The parsed token
 * @param context - The template context
 * @param options - Template options
 * @returns The resolved value
 */
function resolveToken(
  token: ParsedToken,
  context: TemplateContext,
  options?: TemplateOptions
): unknown {
  let resolved: unknown;
  
  // Try to get strategy from registry
  if (token.prefix) {
    const strategy = getStrategy(token.prefix);
    if (strategy) {
      resolved = strategy.resolve(token.key, context);
    } else {
      // Unknown prefix, try fallback
      resolved = fallbackStrategy.resolve(token.content, context);
    }
  } else {
    // No prefix, use fallback strategy
    resolved = fallbackStrategy.resolve(token.key, context);
  }
  
  // Handle undefined/null resolution
  if (resolved === undefined || resolved === null) {
    if (options?.strict) {
      throw new Error(`Failed to resolve template token: ${token.content}`);
    }
    
    if (options?.logWarnings) {
      console.warn(`[TemplateResolver] Could not resolve: ${token.content}`);
    }
    
    return options?.defaultValue !== undefined ? options.defaultValue : "";
  }
  
  return coerceValue(resolved, options);
}

/**
 * Resolve all template tokens in a string.
 * 
 * @param template - The template string containing {{tokens}}
 * @param context - The template context with all available data
 * @param options - Optional configuration for resolution behavior
 * @returns The template string with all tokens replaced
 * 
 * @example
 * ```typescript
 * const result = resolveTemplate(
 *   "{{user.name}} - {{resource_id}}",
 *   { user: { name: "John" }, entity: { id: "123" }, idColumn: "id" }
 * );
 * // result = "John - 123"
 * ```
 */
export function resolveTemplate(
  template: string,
  context: TemplateContext,
  options?: TemplateOptions
): string {
  if (!template || typeof template !== "string") {
    return String(template ?? "");
  }
  
  // No template markers, return as-is
  if (!template.includes("{{")) {
    return template;
  }
  
  // Replace all template tokens
  const result = template.replace(TEMPLATE_REGEX, (fullMatch, content) => {
    const token = parseToken(content);
    const resolved = resolveToken(token, context, options);
    return String(resolved ?? "");
  });
  
  return result;
}

/**
 * Resolve a template value that may be a string, number, boolean, or null.
 * Returns the same type as input if possible.
 * 
 * @param value - The value to resolve (string templates will be processed)
 * @param context - The template context
 * @param options - Template options
 * @returns The resolved value with type preservation
 */
export function resolveTemplateValue(
  value: string | number | boolean | null | undefined,
  context: TemplateContext,
  options?: TemplateOptions
): string | number | boolean | null | undefined {
  // Non-string values pass through
  if (typeof value !== "string") {
    return value;
  }
  
  // Check if it's a pure template (entire value is a single token)
  const trimmed = value.trim();
  const pureMatch = trimmed.match(/^\{\{(.*?)\}\}$/);
  
  if (pureMatch) {
    // Pure template - preserve original type
    const token = parseToken(pureMatch[1]);
    const resolved = resolveToken(token, context, { ...options, preserveTypes: true });
    
    // Type coercion for pure templates
    if (typeof resolved === "number") return resolved;
    if (typeof resolved === "boolean") return resolved;
    if (resolved === null) return null;
    if (resolved === undefined) return undefined;
    
    // Try to coerce string to number/boolean
    const str = String(resolved);
    if (!isNaN(Number(str)) && str.trim() !== "") {
      return Number(str);
    }
    if (str.toLowerCase() === "true") return true;
    if (str.toLowerCase() === "false") return false;
    if (str === "") return null;
    
    return str;
  }
  
  // Mixed template - return as string
  return resolveTemplate(value, context, options);
}
