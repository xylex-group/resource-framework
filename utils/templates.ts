"use client";

import { getValueByKeyCase, getValueByPathCase } from "./key-case";

/**
 * Safely replaces {{TOKENS}} in a template string with values from a data object.
 * When a value is undefined or empty, the token is removed entirely.
 * Collapses duplicate whitespace and trims the result.
 * Supports nested property access using dot notation (e.g., {{user.name}}).
 *
 * @param template - Template string containing {{tokens}} to replace
 * @param data - Object containing values to substitute into the template
 * @returns Processed string with tokens replaced, or empty string if nothing remains
 *
 * @example
 * ```tsx
 * const result = safeTemplate('Hello {{name}}!', { name: 'John' });
 * // result = 'Hello John!'
 *
 * const nested = safeTemplate('{{user.name}} - {{user.email}}', {
 *   user: { name: 'Jane', email: 'jane@example.com' }
 * });
 * // nested = 'Jane - jane@example.com'
 * ```
 */
export function safeTemplate(
  template: string,
  data: Record<string, unknown> | null | undefined,
): string {
  try {
    const t = String(template || "");
    if (!t.includes("{{")) return t;
    const replaced = t.replace(/\{\{(.*?)\}\}/g, (_m, raw) => {
      const key = String(raw || "").trim();
      const value = key.includes(".")
        ? getValueByPathCase(data || null, key)
        : getValueByKeyCase(data || null, key);
      if (value == null || String(value) === "undefined") return "";
      const s = String(value);
      return s;
    });
    return replaced.replace(/\s+/g, " ").trim();
  } catch {
    return String(template || "");
  }
}
