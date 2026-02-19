"use client";

import { insertData } from "@/lib/actions/data";

/**
 * Inserts a single row into a database table
 * @param table - Name of the table to insert into
 * @param insertBody - Object containing the row data to insert
 * @returns Promise resolving to object with ok status and optional data
 */
export async function insertRow(
  table: string,
  insertBody: Record<string, unknown>,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const resp = await insertData({
    table_name: table,
    insert_body: insertBody,
  });
  if (resp.error) {
    console.error("insertRow failed:", resp.error, { table, insertBody });
    return { ok: false, error: resp.error };
  }
  return { ok: true, data: resp.data };
}
