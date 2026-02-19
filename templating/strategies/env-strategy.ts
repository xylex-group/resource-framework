import type { TemplateStrategy, TemplateContext } from "../types";

/**
 * Strategy for resolving environment variables.
 * Resolves templates like {{env.MINIO_BUCKET}} to process.env.MINIO_BUCKET.
 *
 * Security: Only works server-side. On client, returns undefined.
 * Optionally respects a whitelist in context.allowedEnvVars.
 */
export class EnvStrategy implements TemplateStrategy {
  resolve(key: string, context: TemplateContext): unknown {
    const shouldLogWarnings = context.custom?.logWarnings !== false;

    // Client-side check
    if (typeof window !== "undefined") {
      if (shouldLogWarnings) {
        console.warn(
          `[EnvStrategy] Cannot access environment variable '${key}' on client-side`,
        );
      }
      return undefined;
    }

    // Server-side resolution
    if (typeof process === "undefined" || !process.env) {
      return undefined;
    }

    // Whitelist check if provided
    const hasWhitelist =
      context.allowedEnvVars && context.allowedEnvVars.length > 0;
    const isNotInWhitelist =
      hasWhitelist && !context.allowedEnvVars?.includes(key);

    if (isNotInWhitelist) {
      if (shouldLogWarnings) {
        console.warn(
          `[EnvStrategy] Environment variable '${key}' is not in the allowed list`,
        );
      }
      return undefined;
    }

    return process.env[key];
  }
}
