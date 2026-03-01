"use server";

import { insertDataViaAthena } from "../adapters/athena-gateway";

export interface DataApiInsertParams {
  table: string;
  insertBody: Record<string, unknown>;
  schema?: string;
  user?: {
    company_id?: string | null;
    organization_id?: string | null;
    user_id?: string | null;
  };
}

export async function insertViaDataApi(params: DataApiInsertParams) {
  const { table, insertBody, schema = "public", user } = params;
  try {
    const response = await insertDataViaAthena({
      table_name: table,
      schema,
      insert_body: insertBody,
    }, {
      headers: {
        "Content-Type": "application/json",
        "X-Company-Id": user?.company_id || "",
        "X-Organization-Id": user?.organization_id || "",
        "X-User-Id": user?.user_id || "",
      },
    });

    if (response.error) {
      return { ok: false, error: response.error };
    }

    return { ok: true, data: response.data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
