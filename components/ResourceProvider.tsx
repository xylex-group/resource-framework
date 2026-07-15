"use client";

import { useUserStore } from "@/lib/stores";
import { fetchDataViaAthena } from "../adapters/athena-gateway";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  FlagsViewRow,
  Notification,
  ResourceContextValue,
  ResourceProviderProps,
  UserPermissionScope,
  UserPreference,
} from "../resource-types";

// Retained for public API compatibility; document hydration belongs to the host layout.
export const suppressHydrationWarning = true;

export type {
  FlagsViewRow,
  Notification,
  ResourceContextValue,
  ResourceProviderProps,
  UserPermissionScope,
  UserPreference,
};

const ResourceContext = createContext<ResourceContextValue | undefined>(
  undefined,
);

/**
 * Provider component that manages resource context including user preferences, scopes, notifications, and flags
 * @param props - Component props including children and cacheEnabled
 * @returns React component
 */
export const ResourceProvider: React.FC<ResourceProviderProps> = ({
  children,
  cacheEnabled = true,
}) => {
  const { user } = useUserStore();
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([]);
  const [userScopes, setUserScopes] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  /**
   * @deprecated Feature flags are deprecated and will be removed in a future version.
   * Use user permission scopes instead via hasScope().
   * See: docs/FEATURE_FLAGS_REMOVAL.md for migration guide.
   */
  const [flags, setFlags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchedRef = useRef(false);

  /**
   * Fetches all resource data including preferences, scopes, notifications, and flags
   * @deprecated Feature flags fetching is deprecated. Use user permission scopes instead.
   */
  const fetchAllResources = useCallback(async () => {
    if (!user?.user_id || !user?.organization_id || !user?.company_id) {
      setUserPreferences([]);
      setUserScopes([]);
      setNotifications([]);
      setFlags([]); // @deprecated - flags will be removed
      return;
    }

    if (fetchedRef.current && cacheEnabled) return;
    fetchedRef.current = true;
    setIsLoading(true);

    try {
      // Fetch all resources in parallel
      const [prefsRes, scopesRes, notificationsRes, flagsRes] = await Promise
        .all([
          fetchDataViaAthena({
            table_name: "user_preferences",
            conditions: [{ eq_column: "user_id", eq_value: user.user_id }],
            limit: 100,
          }),
          fetchDataViaAthena({
            table_name: "user_permission_scopes",
            conditions: [
              { eq_column: "user_id", eq_value: user.user_id },
              { eq_column: "enabled", eq_value: true },
            ],
            limit: 1000,
          }),
          fetchDataViaAthena({
            table_name: "notifications",
            conditions: [{
              eq_column: "company_id",
              eq_value: user.company_id,
            }],
            limit: 100,
          }),
          fetchDataViaAthena({
            table_name: "v_flags",
            schema: "public",
            conditions: [{ eq_column: "user_id", eq_value: user.user_id }],
            columns: ["flags"],
            limit: 1,
          }),
        ]);

      // Process user preferences
      if (!prefsRes.error) {
        const prefs: UserPreference[] = Array.isArray(prefsRes?.data)
          ? prefsRes.data as UserPreference[]
          : [];
        setUserPreferences(prefs);
      }

      // Process user permission scopes
      if (!scopesRes.error) {
        const scopeRows: UserPermissionScope[] = Array.isArray(scopesRes?.data)
          ? scopesRes.data as UserPermissionScope[]
          : [];
        const companyId = String(user.company_id);
        const scopeList = scopeRows
          .filter((r) => r?.scope && r?.enabled)
          .filter(
            (r) =>
              r.global === true || String(r.company_id || "") === companyId,
          )
          .map((r) => String(r.scope!));
        setUserScopes(Array.from(new Set(scopeList)));
      }

      // Process notifications
      if (!notificationsRes.error) {
        const notifs: Notification[] = Array.isArray(notificationsRes?.data)
          ? notificationsRes.data as Notification[]
          : [];
        setNotifications(notifs);
      }

      // Process feature flags
      // @deprecated - Feature flags are deprecated, migrate to user_permission_scopes
      if (!flagsRes.error) {
        const rows = Array.isArray(flagsRes?.data)
          ? flagsRes.data as unknown[]
          : flagsRes?.data
          ? [flagsRes.data]
          : [];
        const first = (rows[0] || {}) as Record<string, unknown>;
        const flagSet = new Set<string>();
        if (first && first.flags != null) {
          try {
            const flagsValue = first.flags as unknown;
            const arr = Array.isArray(flagsValue)
              ? flagsValue
              : typeof flagsValue === "string"
              ? JSON.parse(flagsValue)
              : [];
            for (const f of arr as string[]) {
              if (typeof f === "string" && f.length > 0) flagSet.add(f);
            }
          } catch {}
        }
        setFlags(Array.from(flagSet));
      }
    } catch (error) {
      console.error("ResourceProvider: Failed to fetch resources", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.user_id, user?.organization_id, user?.company_id, cacheEnabled]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchAllResources();
  }, [fetchAllResources]);

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    fetchedRef.current = false;
    await fetchAllResources();
  }, [fetchAllResources]);

  // Handle real-time updates from DMS events
  const _handleDMSEvent = useCallback(
    (_message: unknown) => {
      try {
        const eventData = (_message as { data?: unknown })?.data;
        if (!eventData) return;

        const { event, resource, body } = eventData as {
          event?: string;
          resource?: string;
          body?: Record<string, unknown>;
        };

        // Handle user_preferences updates
        if (resource === "user_preferences" && body) {
          if (event === "INSERT") {
            setUserPreferences((prev) => {
              // Check if already exists
              const exists = prev.some(
                (p) =>
                  p.id === body.id ||
                  p.user_preference_id === body.user_preference_id,
              );
              return exists ? prev : [...prev, body as UserPreference];
            });
          } else if (event === "UPDATE") {
            setUserPreferences((prev) =>
              prev.map((p) =>
                p.id === body.id ||
                  p.user_preference_id === body.user_preference_id
                  ? { ...p, ...body }
                  : p
              )
            );
          } else if (event === "DELETE") {
            setUserPreferences((prev) =>
              prev.filter(
                (p) =>
                  p.id !== body.id &&
                  p.user_preference_id !== body.user_preference_id,
              )
            );
          }
        }

        // Handle user_permission_scopes updates
        if (resource === "user_permission_scopes" && body) {
          if (event === "INSERT") {
            // Only add if enabled and matches current user
            if (
              body.enabled &&
              body.user_id === user?.user_id &&
              body.scope &&
              user
            ) {
              const companyId = String(user.company_id);
              if (
                body.global === true ||
                String(body.company_id || "") === companyId
              ) {
                setUserScopes((prev) => {
                  const scope = String(body.scope);
                  return prev.includes(scope) ? prev : [...prev, scope];
                });
              }
            }
          } else if (event === "UPDATE") {
            const companyId = String(user?.company_id);
            const shouldInclude = body.enabled &&
              body.user_id === user?.user_id &&
              body.scope &&
              user &&
              (body.global === true ||
                String(body.company_id || "") === companyId);

            setUserScopes((prev) => {
              const scope = String(body.scope);
              if (shouldInclude) {
                return prev.includes(scope) ? prev : [...prev, scope];
              } else {
                return prev.filter((s) => s !== scope);
              }
            });
          } else if (event === "DELETE") {
            if (body.scope) {
              const scope = String(body.scope);
              setUserScopes((prev) => prev.filter((s) => s !== scope));
            }
          }
        }

        // Handle notifications updates
        if (resource === "notifications" && body) {
          if (event === "INSERT") {
            // Only add if it matches current company
            if (body.company_id === user?.company_id) {
              setNotifications((prev) => {
                const exists = prev.some(
                  (n) =>
                    n.notification_id === body.notification_id ||
                    n.id === body.id,
                );
                return exists ? prev : [body as Notification, ...prev];
              });
            }
          } else if (event === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) =>
                n.notification_id === body.notification_id ||
                  n.id === body.id
                  ? { ...n, ...body }
                  : n
              )
            );
          } else if (event === "DELETE") {
            setNotifications((prev) =>
              prev.filter(
                (n) =>
                  n.notification_id !== body.notification_id &&
                  n.id !== body.id,
              )
            );
          }
        }

        // Handle v_flags updates (though flags are typically in a view, handle user table updates)
        // @deprecated - v_flags and feature flags are deprecated, use user_permission_scopes instead
        if ((resource === "users" || resource === "v_flags") && body) {
          // For flags, we might need to refetch since it's a view
          // But if the body contains flags, we can update directly
          if (body.flags && body.user_id === user?.user_id) {
            try {
              const flagSet = new Set<string>();
              const arr = Array.isArray(body.flags)
                ? body.flags
                : typeof body.flags === "string"
                ? JSON.parse(body.flags as string)
                : [];
              for (const f of arr as string[]) {
                if (typeof f === "string" && f.length > 0) flagSet.add(f);
              }
              setFlags(Array.from(flagSet));
            } catch {
              // Ignore parse errors
            }
          }
        }
      } catch (error) {
        console.error("ResourceProvider: Error handling DMS event", error);
      }
    },
    [user?.user_id, user?.company_id],
  );

  // Connect to DMS events stream
  // useEventsStream(handleDMSEvent);

  // hasScope helper
  const hasScope = useMemo(() => {
    const set = new Set(userScopes);
    return (required: string | string[], opts?: { all?: boolean }) => {
      const reqList = Array.isArray(required) ? required : [required];
      if (reqList.length === 0) return true;
      if (opts?.all) {
        return reqList.every((s) => set.has(String(s)));
      }
      return reqList.some((s) => set.has(String(s)));
    };
  }, [userScopes]);

  // hasFlag helper
  /**
   * @deprecated hasFlag is deprecated and will be removed in a future version.
   * Use hasScope() instead for permission checks.
   * Migration: Replace hasFlag('feature_name') with hasScope('feature_name')
   */
  const hasFlag = useMemo(() => {
    const set = new Set(flags);
    return (flag: string) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[DEPRECATED] hasFlag('${flag}') is deprecated. Use hasScope() instead. ` +
            `See docs/FEATURE_FLAGS_REMOVAL.md for migration guide.`,
        );
      }
      return set.has(flag);
    };
  }, [flags]);

  const value: ResourceContextValue = useMemo(
    () => ({
      userPreferences,
      userScopes,
      notifications,
      flags,
      hasScope,
      hasFlag,
      isLoading,
      refetch,
    }),
    [
      userPreferences,
      userScopes,
      notifications,
      flags,
      hasScope,
      hasFlag,
      isLoading,
      refetch,
    ],
  );

  return (
    <ResourceContext.Provider value={value}>
      {children}
    </ResourceContext.Provider>
  );
};

export { ResourceContext };
