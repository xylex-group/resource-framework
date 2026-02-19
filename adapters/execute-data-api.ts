"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * Retries an async function with exponential backoff
 * @param fn - The async function to retry
 * @param attempts - Number of retry attempts (default 3)
 * @returns Promise resolving to the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown = null;
  for (let i = 0; i < Math.max(1, attempts); i += 1) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const backoffMs = Math.min(30_000, 250 * Math.pow(2, i));
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

// Guard against large batch inserts. Keep a reasonable chunk size.
const MAX_ROWS_PER_BATCH = 1000;

/**
 * Inserts multiple rows into a table using Drizzle ORM with automatic chunking for large batches
 * @param opts - Options object containing table, rows, and schema
 * @returns Promise resolving to array of inserted rows
 */
export async function drizzleInsertMany<
  T extends Record<string, unknown>,
>(opts: { table: string; rows: T[]; schema?: string }): Promise<T[]> {
  const { table, rows, schema = "public" } = opts;
  if (!Array.isArray(rows) || rows.length === 0) return [];

  // If the batch is too large, split it recursively
  if (rows.length > MAX_ROWS_PER_BATCH) {
    // Split approximately in half and send sequentially to preserve order
    const mid = Math.floor(rows.length / 2);
    const left = rows.slice(0, mid);
    const right = rows.slice(mid);
    const leftResult = await drizzleInsertMany({
      table,
      rows: left,
      schema,
    });
    const rightResult = await drizzleInsertMany({
      table,
      rows: right,
      schema,
    });
    return [...leftResult, ...rightResult];
  }

  try {
    // Build the column names from the first row
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    if (columns.length === 0) {
      throw new Error("No columns found in rows");
    }

    // Build the VALUES clause
    const values = rows
      .map((row) => {
        return `(${columns
          .map((col) => {
            const value = row[col];
            if (value === null || value === undefined) return "NULL";
            if (typeof value === "string") {
              return sql
                .raw(`'${value.replace(/'/g, "''")}'`)
                .queryChunks.join("");
            }
            if (typeof value === "number") return String(value);
            if (typeof value === "boolean") return value ? "true" : "false";
            if (typeof value === "object") {
              return sql
                .raw(`'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`)
                .queryChunks.join("");
            }
            return sql
              .raw(`'${String(value).replace(/'/g, "''")}'`)
              .queryChunks.join("");
          })
          .join(", ")})`;
      })
      .join(", ");

    // Execute the insert using raw SQL with RETURNING *
    const fullTableName =
      schema !== "public" ? `"${schema}"."${table}"` : `"${table}"`;
    const query = sql.raw(
      `INSERT INTO ${fullTableName} (${columns
        .map((c) => `"${c}"`)
        .join(", ")}) VALUES ${values} RETURNING *`,
    );

    const result = await db.execute(query);
    return result.rows as T[];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Drizzle insert error for table ${schema}.${table}: ${errorMessage}`,
    );
  }
}
