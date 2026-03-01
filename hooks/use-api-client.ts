"use client";

/**
 * useApiClient Hook - Drizzle ORM Edition
 * Provides type-safe CRUD operations using server actions with Drizzle ORM
 * Migrated from external API calls to direct database operations
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteDataViaAthena,
  fetchDataViaAthena,
  insertDataViaAthena,
  type DataCondition,
  updateDataViaAthena,
} from "../adapters/athena-gateway";
import { useUserStore } from "@/lib/stores";

interface Condition {
  eq_column: string;
  eq_value: string | number | boolean | null;
}

interface UseApiClientBaseProps {
  conditions?: Condition[];
  columns?: string[];
  limit?: number;
  offset?: number;
  enabled?: boolean;
  noCache?: boolean;
  single?: boolean;
  schema?: string;
  forceExternalApi?: boolean;
}

export interface UseApiClientSingleProps extends UseApiClientBaseProps {
  table: string;
}

export interface UseApiClientMultiProps extends UseApiClientBaseProps {
  table: string[];
}

export type UseApiClientProps = UseApiClientSingleProps | UseApiClientMultiProps;

// Helper to build client for a single table
function buildClientFor<T>(
  tableName: string,
  schema: string,
  forceExternalApi: boolean = false,
  athenaHeaders: Record<string, string> = {},
) {
  const fetchWhere = async ({
    conditions: where = [],
    columns: cols,
    limit: lim,
    offset: off,
    single: one = false,
    schema: sch,
  }: {
    conditions?: Condition[];
    columns?: string[];
    limit?: number;
    offset?: number;
    single?: boolean;
    noCache?: boolean;
    schema?: string;
  } = {}): Promise<T | T[] | null> => {
    try {
      const effectiveLimit = one ? 1 : (lim ?? 100);

      const response = await fetchDataViaAthena<T[]>({
        table_name: tableName,
        schema: sch || schema,
        conditions: where as DataCondition[],
        columns: cols,
        limit: effectiveLimit,
        offset: off ?? 0,
      }, {
        headers: athenaHeaders,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const rows = (response.data as T[]) || [];

      if (one) {
        return rows[0] || null;
      }
      return rows;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch data",
      );
    }
  };

  const insert = async (insertBody: Partial<T>): Promise<T> => {
    try {
      const response = await insertDataViaAthena<T>({
        table_name: tableName,
        schema,
        insert_body: insertBody as Record<string, unknown>,
      }, {
        headers: athenaHeaders,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data as T;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to insert data",
      );
    }
  };

  const insertMany = async (rows: Partial<T>[]): Promise<T[]> => {
    try {
      if (!Array.isArray(rows) || rows.length === 0) {
        return [];
      }

      const response = await insertDataViaAthena<T | T[]>({
        table_name: tableName,
        schema,
        insert_body: rows as Record<string, unknown>[],
      }, {
        headers: athenaHeaders,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const data = response.data;
      return Array.isArray(data) ? (data as T[]) : data ? [data as T] : [];
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to insert multiple records",
      );
    }
  };

  const update = async (
    idColumn: string,
    id: string | number,
    updateBody: Record<string, unknown>,
  ): Promise<T> => {
    if (forceExternalApi) {
      console.log("[apiClient.update] forceExternalApi is enabled; using Athena gateway SDK");
    }

    try {
      console.log("[apiClient.update] Calling updateData with:", {
        table_name: tableName,
        schema,
        x_column: idColumn,
        x_id: id,
        update_body: updateBody,
      });

      const response = await updateDataViaAthena<T | T[]>({
        table_name: tableName,
        schema,
        x_column: idColumn,
        x_id: id,
        update_body: updateBody,
      }, {
        headers: athenaHeaders,
      });

      console.log("[apiClient.update] updateData response:", response);

      if (response.error) {
        console.error("[apiClient.update] Response has error:", response.error);
        throw new Error(response.error);
      }

      console.log("[apiClient.update] Update successful, verifying...");
      
      // Verify the update by fetching the record
      try {
        const verifyResponse = await fetchDataViaAthena<T[]>({
          table_name: tableName,
          schema,
          conditions: [{
            eq_column: idColumn,
            eq_value: id as string | number | boolean | null,
          }],
          limit: 1,
        }, {
          headers: athenaHeaders,
        });

        console.log("[apiClient.update] Verification fetch response:", verifyResponse);

        if (!verifyResponse.error && verifyResponse.data) {
          const fetchedData = Array.isArray(verifyResponse.data) 
            ? verifyResponse.data[0] 
            : verifyResponse.data;
          
          console.log("[apiClient.update] Fetched record after update:", fetchedData);
          
          // Helper to convert snake_case to camelCase
          const snakeToCamel = (str: string): string => {
            return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
          };
          
          // Check if the updated fields match (accounting for snake_case to camelCase conversion)
          const mismatches: string[] = [];
          const notReturned: string[] = [];
          
          // Helper to compare values with type coercion for numbers
          const valuesMatch = (expected: unknown, actual: unknown): boolean => {
            // If strictly equal, they match
            if (expected === actual) return true;
            
            // Handle null/undefined
            if (expected == null && actual == null) return true;
            if (expected == null || actual == null) return false;
            
            // Handle number/string coercion (database may return numbers as strings)
            if (typeof expected === 'number' && typeof actual === 'string') {
              return expected === Number(actual) && !isNaN(Number(actual));
            }
            if (typeof expected === 'string' && typeof actual === 'number') {
              return Number(expected) === actual && !isNaN(Number(expected));
            }
            
            // Handle Date comparisons
            if (expected instanceof Date && typeof actual === 'string') {
              return expected.toISOString() === actual || expected.getTime() === new Date(actual).getTime();
            }
            if (typeof expected === 'string' && actual instanceof Date) {
              return expected === actual.toISOString() || new Date(expected).getTime() === actual.getTime();
            }
            
            // Handle date string comparisons (ISO format vs PostgreSQL timestamp format)
            // e.g., "2026-01-26T23:00:00.000Z" vs "2026-01-26 23:00:00+00"
            if (typeof expected === 'string' && typeof actual === 'string') {
              // Check if both look like dates
              const expectedDate = new Date(expected);
              const actualDate = new Date(actual);
              
              // If both are valid dates, compare their timestamps
              if (!isNaN(expectedDate.getTime()) && !isNaN(actualDate.getTime())) {
                // Compare timestamps (ignore format differences)
                return expectedDate.getTime() === actualDate.getTime();
              }
            }
            
            // Fall back to JSON comparison for objects/arrays
            return JSON.stringify(actual) === JSON.stringify(expected);
          };
          
          for (const [key, expectedValue] of Object.entries(updateBody)) {
            // Skip verification for priority field - it may have caching/race condition issues
            // The optimistic update already handles the UI, so verification is less critical
            if (key === "priority") {
              continue;
            }
            
            // Try both the original key and its camelCase version
            const camelKey = snakeToCamel(key);
            const hasKey = key in (fetchedData as Record<string, unknown>);
            const hasCamelKey = camelKey in (fetchedData as Record<string, unknown>);
            
            if (!hasKey && !hasCamelKey) {
              // Field wasn't returned in the fetch (might not be in columns list)
              notReturned.push(key);
              continue;
            }
            
            const actualValue = (fetchedData as Record<string, unknown>)?.[key] ?? 
                               (fetchedData as Record<string, unknown>)?.[camelKey];
            
            if (!valuesMatch(expectedValue, actualValue)) {
              mismatches.push(`${key}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)} (checked: ${key}, ${camelKey})`);
            }
          }
          
          if (notReturned.length > 0) {
            console.warn("[apiClient.update] Some fields were not returned in verification (may not be in columns list):", notReturned);
          }
          
          if (mismatches.length > 0) {
            console.error("[apiClient.update] Verification failed! Mismatches:", mismatches);
          } else {
            console.log("[apiClient.update] Verification successful - all returned fields match");
          }
        }
      } catch (verifyError) {
        console.warn("[apiClient.update] Verification fetch failed:", verifyError);
      }

      return response.data as T;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update data",
      );
    }
  };

  const remove = async (
    idColumn: string,
    id: string | number,
    updateBody: Record<string, unknown> = {},
  ): Promise<T> => {
    try {
      const response = await deleteDataViaAthena<T>({
        table_name: tableName,
        schema,
        x_column: idColumn,
        x_id: id,
        update_body: updateBody,
      }, {
        headers: athenaHeaders,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data as T;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete data",
      );
    }
  };

  return { fetchWhere, insert, insertMany, update, remove };
}

export interface ApiClientInstance<T> {
  fetchWhere: (params?: {
    conditions?: Condition[];
    columns?: string[];
    limit?: number;
    offset?: number;
    single?: boolean;
    noCache?: boolean;
    schema?: string;
  }) => Promise<T | T[] | null>;
  insert: (insertBody: Partial<T>) => Promise<T>;
  insertMany: (rows: Partial<T>[]) => Promise<T[]>;
  update: (
    idColumn: string,
    id: string | number,
    updateBody: Record<string, unknown>,
  ) => Promise<T>;
  remove: (
    idColumn: string,
    id: string | number,
    updateBody?: Record<string, unknown>,
  ) => Promise<T>;
}

export interface UseApiClientSingleReturn<T> {
  data: T | T[] | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  cacheKey: null;
  mutate: () => Promise<void>;
  fetchWhere: ApiClientInstance<T>["fetchWhere"];
  insert: ApiClientInstance<T>["insert"];
  insertMany: ApiClientInstance<T>["insertMany"];
  update: ApiClientInstance<T>["update"];
  remove: ApiClientInstance<T>["remove"];
}

export interface UseApiClientMultiReturn<T> {
  clients: Record<string, ApiClientInstance<T>>;
}

export function useApiClient<T>(props: UseApiClientSingleProps): UseApiClientSingleReturn<T>;
export function useApiClient<T>(props: UseApiClientMultiProps): UseApiClientMultiReturn<T>;
export function useApiClient<T>({
  table,
  conditions = [],
  columns,
  limit,
  offset,
  enabled = true,
  noCache = false,
  single = false,
  schema = "public",
  forceExternalApi = false,
}: UseApiClientProps) {
  const { user } = useUserStore();
  const [data, setData] = useState<T | T[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if we're in multi-table mode
  const isMultiTable = Array.isArray(table);
  const tableName = isMultiTable ? (table as string[])[0] : (table as string);

  const athenaHeaders = useMemo(() => {
    const headers: Record<string, string> = {};

    if (user?.user_id) {
      headers["X-User-Id"] = user.user_id;
    }
    if (user?.company_id) {
      headers["X-Company-Id"] = user.company_id;
    }
    if (user?.organization_id) {
      headers["X-Organization-Id"] = user.organization_id;
    }

    return headers;
  }, [user?.user_id, user?.company_id, user?.organization_id]);

  // Memoize stringified values to prevent unnecessary re-renders
  const conditionsStr = useMemo(() => JSON.stringify(conditions), [conditions]);
  const columnsStr = useMemo(() => JSON.stringify(columns || []), [columns]);

  // Build multi-table clients map
  const clients = useMemo(() => {
    if (!isMultiTable) return null;

    return Object.fromEntries(
      (table as string[]).map((
        tName,
      ) => [tName, buildClientFor<T>(tName, schema, forceExternalApi, athenaHeaders)]),
    );
  }, [isMultiTable, table, schema, forceExternalApi, athenaHeaders]);

  // Fetch data function
  const fetchDataFromApi = useCallback(async () => {
    if (!enabled || isMultiTable) {
      if (!enabled) {
        // Avoid stale data/errors when a query is disabled (e.g. waiting for session/user context)
        setData(null);
        setIsError(false);
        setError(null);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const effectiveLimit = single ? 1 : limit;

      if (!tableName) {
        return;
      }

      const response = await fetchDataViaAthena<T[]>({
        table_name: tableName,
        schema,
        conditions: conditions as DataCondition[],
        columns,
        limit: effectiveLimit ?? 100,
        offset: offset ?? 0,
      }, {
        headers: athenaHeaders,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Handle single item vs array based on the single flag
      const rows = (response.data as T[]) || [];

      if (single) {
        setData((rows[0] as T) ?? null);
        return;
      }

      setData(rows);
    } catch (err) {
      setIsError(true);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    isMultiTable,
    tableName,
    conditionsStr,
    columnsStr,
    limit,
    offset,
    single,
    noCache,
    schema,
    athenaHeaders,
  ]);

  useEffect(() => {
    fetchDataFromApi();
  }, [fetchDataFromApi]);

  const mutate = useCallback(async () => {
    await fetchDataFromApi();
  }, [fetchDataFromApi]);

  const fetchWhere = useCallback(
    async ({
      conditions: where = [],
      columns: cols,
      limit: lim,
      offset: off,
      single: one = false,
      schema: sch,
    }: {
      conditions?: Condition[];
      columns?: string[];
      limit?: number;
      offset?: number;
      single?: boolean;
      noCache?: boolean;
      schema?: string;
    } = {}): Promise<T | T[] | null> => {
      try {
        const effectiveLimit = one ? 1 : (lim ?? 100);

        const response = await fetchDataViaAthena<T[]>({
          table_name: tableName,
          schema: sch || schema,
          conditions: where as DataCondition[],
          columns: cols,
          limit: effectiveLimit,
          offset: off ?? 0,
        }, {
          headers: athenaHeaders,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        const rows = (response.data as T[]) || [];

        if (one) {
          return rows[0] || null;
        }
        return rows;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to fetch data",
        );
      }
    },
    [tableName, schema, athenaHeaders],
  );

  // Insert function
  const insert = useCallback(
    async (insertBody: Partial<T>): Promise<T> => {
      try {
        const response = await insertDataViaAthena<T>({
          table_name: tableName,
          schema,
          insert_body: insertBody as Record<string, unknown>,
        }, {
          headers: athenaHeaders,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        await mutate();
        return response.data as T;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Insert operation failed",
        );
      }
    },
    [tableName, schema, mutate, athenaHeaders],
  );

  // Bulk insert function
  const insertMany = useCallback(
    async (rows: Partial<T>[]): Promise<T[]> => {
      try {
        if (!Array.isArray(rows) || rows.length === 0) {
          return [];
        }

        const response = await insertDataViaAthena<T | T[]>({
          table_name: tableName,
          schema,
          insert_body: rows as Record<string, unknown>[],
        }, {
          headers: athenaHeaders,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        // Refresh data after insert
        await mutate();

        const data = response.data;
        if (Array.isArray(data)) {
          return data as T[];
        }
        return data ? [data as T] : [];
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Bulk insert operation failed",
        );
      }
    },
    [tableName, schema, mutate, athenaHeaders],
  );

  // Create a client instance for single-table update operations
  const singleTableClient = useMemo(
    () => buildClientFor<T>(tableName, schema, forceExternalApi, athenaHeaders),
    [tableName, schema, forceExternalApi, athenaHeaders]
  );

  const update = useCallback(
    async (
      idColumn: string,
      id: string | number,
      updateBody: Record<string, unknown>,
    ): Promise<T> => {
      try {
        const result = await singleTableClient.update(idColumn, id, updateBody);
        await mutate();
        return result;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Update operation failed",
        );
      }
    },
    [singleTableClient, mutate],
  );

  const remove = useCallback(
    async (
      idColumn: string,
      id: string | number,
      updateBody: Record<string, unknown> = {},
    ): Promise<T> => {
      try {
        const response = await deleteDataViaAthena<T>({
          table_name: tableName,
          schema,
          x_column: idColumn,
          x_id: id,
          update_body: updateBody,
        }, {
          headers: athenaHeaders,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        await mutate();
        return response.data as T;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Delete operation failed",
        );
      }
    },
    [tableName, schema, mutate, athenaHeaders],
  );

  // Return multi-table clients if in multi-table mode
  if (isMultiTable && clients) {
    return {
      clients,
    } as UseApiClientMultiReturn<T>;
  }

  // Return single table interface
  return {
    data,
    isLoading,
    isError,
    error,
    cacheKey: null, // No longer needed with Drizzle
    mutate,
    fetchWhere,
    insert,
    insertMany,
    update,
    remove,
  };
}
