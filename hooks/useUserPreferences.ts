"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ResourceRoute } from "../resource-types";
import {
  fetchDataViaAthena,
  insertDataViaAthena,
  updateDataViaAthena,
} from "../adapters/athena-gateway";

interface UserPreferenceRow {
  id?: number;
  settings?: Record<string, unknown>;
}

/**
 * Hook to load and persist user preferences for a specific resource table using Athena.
 * Automatically fetches preferences on mount and debounces updates to the database.
 *
 * @param user - The current user object
 * @param resource - The resource route configuration
 * @param displayContext - The display context identifier (e.g., "v2_customers")
 * @param contextSettings - Current settings object to persist
 * @param setDisplaySetting - Optional callback to update display settings in parent state
 * @returns Object containing preference ID ref and fetch status ref
 *
 * @example
 * ```tsx
 * const { prefIdRef } = useUserPreferences(
 *   user,
 *   resource,
 *   'v2_customers',
 *   settings,
 *   setDisplaySetting
 * );
 * ```
 */
export const useUserPreferences = (
  user: {
    user_id?: string | number | null;
    company_id?: string | number | null;
    organization_id?: string | number | null;
  } | null,
  resource: ResourceRoute | null,
  displayContext: string,
  contextSettings: Record<string, unknown>,
  setDisplaySetting?: (context: string, key: string, value: unknown) => void,
) => {
  const prefIdRef = useRef<number | null>(null);
  const initialPrefsFetchOkRef = useRef<boolean | null>(null);

  const setDisplaySettingCallback = useCallback(
    (context: string, key: string, value: unknown) => {
      setDisplaySetting?.(context, key, value);
    },
    [setDisplaySetting],
  );

  useEffect(() => {
    let aborted = false;
    async function loadPrefs() {
      try {
        if (!user?.user_id || !user?.company_id || !user?.organization_id) {
          return;
        }

        const response = await fetchDataViaAthena({
          table_name: "user_preferences",
          conditions: [
            { eq_column: "user_id", eq_value: user.user_id ?? null },
            { eq_column: "table_name", eq_value: resource?.table || "" },
          ],
          limit: 1,
        });

        if (response.error || !response.data) {
          initialPrefsFetchOkRef.current = false;
          return;
        }

        initialPrefsFetchOkRef.current = true;
        const rows = Array.isArray(response.data) ? response.data : [];

        if (aborted) return;

        if (rows.length > 0) {
          const row = rows[0] as UserPreferenceRow;
          prefIdRef.current = Number(row?.id) || null;
          const settings = (row?.settings as Record<string, unknown>) || {};

          Object.entries(settings).forEach(([k, v]) => {
            try {
              setDisplaySettingCallback(displayContext, String(k), v);
            } catch {}
          });
        }
      } catch {
        initialPrefsFetchOkRef.current = false;
      }
    }
    loadPrefs();
    return () => {
      aborted = true;
    };
  }, [
    user?.user_id,
    user?.company_id,
    user?.organization_id,
    resource?.table,
    displayContext,
    setDisplaySettingCallback,
  ]);

  useEffect(() => {
    if (!user?.user_id || !user?.company_id || !user?.organization_id) return;
    if (!resource) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const settings = contextSettings || {};

        let idToUse = prefIdRef.current;

        // If we don't have a preference ID yet, try to fetch it
        if (idToUse == null) {
          const response = await fetchDataViaAthena({
            table_name: "user_preferences",
            conditions: [
              { eq_column: "user_id", eq_value: user.user_id ?? null },
              { eq_column: "table_name", eq_value: resource.table },
            ],
            limit: 1,
          });

          if (!response.error && response.data) {
            const rows = Array.isArray(response.data) ? response.data : [];
            if (rows.length > 0) {
              idToUse = Number((rows[0] as UserPreferenceRow)?.id) || null;
            }
          }
        }

        // Update existing preference
        if (idToUse != null && user.user_id != null) {
          await updateDataViaAthena({
            table_name: "user_preferences",
            x_column: "user_id",
            x_id: user.user_id,
            update_body: { settings },
          });
          prefIdRef.current = idToUse;
        } // Insert new preference if initial fetch was successful (table exists)
        else if (initialPrefsFetchOkRef.current === true) {
          const response = await insertDataViaAthena({
            table_name: "user_preferences",
            insert_body: {
              user_id: user.user_id,
              table_name: resource.table,
              settings,
            },
          });

          if (!response.error && response.data) {
            const row = Array.isArray(response.data)
              ? response.data[0]
              : response.data;
            if (row && typeof row === "object" && "id" in row) {
              prefIdRef.current = Number((row as UserPreferenceRow).id);
            }
          }
        }
      } catch (error) {
        console.error("Error saving user preferences:", error);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    contextSettings,
    user?.user_id,
    user?.company_id,
    user?.organization_id,
    resource,
  ]);

  return { prefIdRef, initialPrefsFetchOkRef };
};
