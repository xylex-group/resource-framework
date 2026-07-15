"use client";

import { insertDataViaAthena } from "../adapters/athena-gateway";
import type { AthenaGatewayConfig } from "../adapters/athena-gateway";

/**
 * Inserts a single row into a database table
 * @param table - Name of the table to insert into
 * @param insertBody - Object containing the row data to insert
 * @returns Promise resolving to object with ok status and optional data
 */
export async function insertRow(
  table: string,
  insertBody: Record<string, unknown>,
  options: { schema?: string; config?: AthenaGatewayConfig } = {},
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const resp = await insertDataViaAthena({
    table_name: table,
    schema: options.schema,
    insert_body: insertBody,
  }, options.config);
  if (resp.error) {
    console.error("insertRow failed:", resp.error, { table, insertBody });
    return { ok: false, error: resp.error };
  }
  return { ok: true, data: resp.data };
}
