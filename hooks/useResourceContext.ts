"use client";

import { useContext } from "react";
import {
  ResourceContext,
  type ResourceContextValue,
} from "../components/ResourceProvider";

/**
 * Hook to access the ResourceProvider context.
 * Must be used within a ResourceProvider component.
 *
 * @returns {ResourceContextValue} The resource context value containing user preferences, scopes, notifications, and flags
 * @throws {Error} If used outside of a ResourceProvider
 *
 * @example
 * ```tsx
 * const { hasScope, hasFlag } = useResourceContext();
 *
 *   if (hasScope('admin')) {
 *     // Render admin content
 *   }
 *
 *   // @deprecated - Use hasScope instead
 *   if (hasFlag('feature_xyz')) {
 *     // Render feature xyz
 *   }
 * }
 * ```
 * 
 * @deprecated The hasFlag function is deprecated. Use hasScope() instead.
 * See docs/FEATURE_FLAGS_REMOVAL.md for migration guide.
 */
export function useResourceContext(): ResourceContextValue {
  const context = useContext(ResourceContext);

  if (context === undefined) {
    throw new Error(
      "useResourceContext must be used within a ResourceProvider. " +
        "Make sure to wrap your component tree with <ResourceProvider>.",
    );
  }

  return context;
}
