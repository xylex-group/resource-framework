"use server";

import { APP_CONFIG } from "@/lib/config";

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
    const response = await fetch(`${APP_CONFIG.api.suitsbooks}/data/insert`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Company-Id": user?.company_id || "",
        "X-Organization-Id": user?.organization_id || "",
        "X-User-Id": user?.user_id || "",
      },
      body: JSON.stringify({
        table_name: table,
        schema,
        insert_body: insertBody,
      }),
    });

    const payload = await response.json();
    if (!response.ok || payload?.error) {
      return { ok: false, error: payload?.error ?? "Data API insert failed" };
    }
    return { ok: true, data: payload?.data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
