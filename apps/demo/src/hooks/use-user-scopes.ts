"use client";

export interface UseUserScopesOptions {
  cache_enabled?: boolean;
}

export type UserScopeRecord = Record<string, unknown>;

const DEFAULT_SCOPES = ["admin", "demo"];

export function useUserScopes(_: UseUserScopesOptions = {}) {
  const hasScope = (scope: string | string[]) => {
    if (Array.isArray(scope)) {
      return scope.some((value) => DEFAULT_SCOPES.includes(value));
    }
    return DEFAULT_SCOPES.includes(scope);
  };

  return {
    hasScope,
  };
}
