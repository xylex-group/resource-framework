import type { ColumnConfigObject, ResourceData } from "@/lib/types";
import type { ResourceRoute } from "@/packages/resource-framework/resource-types";
import {
  buildColumnsFromRegistry,
  type LeanColumnSpec,
} from "@/packages/resource-framework/constructors/column-registry";
import { coerceByDatatype } from "@/packages/resource-framework/utils/coerce";
import {
  insertDataViaAthena,
  updateDataViaAthena,
} from "@/packages/resource-framework/adapters/athena-gateway";
import { Dispatch, SetStateAction } from "react";

interface HandleSaveAllParams {
  resource: ResourceRoute;
  data: ResourceData | null;
  setIsEditing: (editing: boolean) => void;
  formState: Record<string, unknown>;
  notification: (params: { message: string; success: boolean }) => void;
  update: (updates: Record<string, unknown>) => Promise<boolean>;
  mutate?: () => Promise<void>;
  setVisibleFields?: Dispatch<SetStateAction<Set<string>>>;
}

export async function handleSaveAll({
  resource,
  data,
  setIsEditing,
  formState,
  notification,
  update,
  mutate,
  setVisibleFields,
}: HandleSaveAllParams) {
  try {
    const original = data || {};
    const editCfg = resource?.edit || {};
    const updates: Record<string, unknown> = {};
    const configured = resource?.columns;

    let keys: string[] = Array?.isArray(configured)
      ? configured
          .filter(
            (c) =>
              !(typeof c === "object" && (c as ColumnConfigObject)?.hidden),
          )
          .map((c) =>
            typeof c === "string" ? c : (c as ColumnConfigObject)?.column_name,
          )
      : Object?.keys(original);

    // Apply allowed/denied filters from resource.edit
    const allowed = Array.isArray(editCfg.allowedColumns)
      ? new Set<string>(editCfg.allowedColumns)
      : null;
    const denied = Array.isArray(editCfg.deniedColumns)
      ? new Set<string>(editCfg.deniedColumns)
      : new Set<string>();
    denied.add(resource?.idColumn || "id");

    keys = keys.filter(
      (k) => (allowed ? allowed.has(k) : true) && !denied.has(k),
    );

    const specs: Array<LeanColumnSpec<ResourceData>> = (
      Array.isArray(configured)
        ? configured.map((c) =>
            typeof c === "string"
              ? { key: c, header: c.replace(/_/g, " ") }
              : {
                  key: (c as ColumnConfigObject)?.column_name,
                  header:
                    (c as ColumnConfigObject)?.header ||
                    (c as ColumnConfigObject)?.header_label,
                  use: (c as ColumnConfigObject)?.use,
                  label: (c as ColumnConfigObject)?.label,
                  order: (c as ColumnConfigObject)?.order,
                  formatter: (c as ColumnConfigObject)?.formatter,
                  minWidth: (c as ColumnConfigObject)?.minWidth,
                  widthFit: (c as ColumnConfigObject)?.widthFit,
                },
          )
        : Object.keys(original).map((k) => ({ key: k, header: k }))
    ) as Array<LeanColumnSpec<ResourceData>>;

    const colDefs = buildColumnsFromRegistry<ResourceData>(specs);
    const datatypeByKey = new Map<string, string | undefined>();

    colDefs.forEach((col) => {
      const colWithAccessor = col as {
        accessorKey?: string;
        id?: string;
        meta?: { datatype?: string };
      };
      const k = colWithAccessor?.accessorKey || colWithAccessor?.id;
      const dt = colWithAccessor?.meta?.datatype;
      if (k) datatypeByKey.set(k, dt);
    });

    // Check all keys in formState, not just configured columns
    // This ensures dynamically added fields are also saved
    const allFormStateKeys = Object.keys(formState);
    const keysToCheck = new Set([...keys, ...allFormStateKeys]);

    keysToCheck.forEach((k) => {
      // Skip if denied or not allowed
      if (denied.has(k)) return;
      if (allowed && !allowed.has(k)) return;

      const nextRaw = formState[k];
      const prevRaw = original[k];
      const dt = datatypeByKey.get(k);
      const next = coerceByDatatype(nextRaw, dt);
      const prev = coerceByDatatype(prevRaw, dt);
      const changed = JSON.stringify(next) !== JSON.stringify(prev);

      if (k === "currency" || changed) {
        console.log(`[save-all] Field "${k}":`, {
          nextRaw,
          prevRaw,
          next,
          prev,
          changed,
          datatype: dt,
        });
      }

      if (changed) updates[k] = next;
    });

    if (Object.keys(updates).length === 0) {
      notification({
        message: "Nothing to save",
        success: true,
      });
      if (!resource?.permanent_edit_state) {
        setIsEditing(false);
      }
      return;
    }

    let ok = false;
    try {
      ok = await update(updates);
    } catch (updateError) {
      console.error("[save-all] Error calling update:", updateError);
      throw updateError;
    }

    if (ok) {
      // Sync price to prices table if this is a product update with price changes
      if (resource?.table === "products" && updates.price !== undefined) {
        await syncProductPrice({
          productId: data?.product_id as string | undefined,
          organizationId: data?.organization_id as string | undefined,
          priceIdPrimary: data?.price_id_primary as string | undefined,
          newPrice: updates.price,
          currency: (data?.currency as string) || "USD",
        });
      }

      // Clear visible fields (dynamically added fields) after successful save
      if (setVisibleFields) {
        setVisibleFields(new Set());
      }

      if (!resource?.permanent_edit_state) {
        setIsEditing(false);
      }
      try {
        // Refresh data using mutate if available, otherwise reload page
        if (mutate) {
          await mutate();
        } else {
          console.warn(
            "[save-all] No mutate function available; skipping refresh",
          );
        }
      } catch (refreshError) {
        console.error("[save-all] Failed to refresh data:", refreshError);
      }
    } else {
      console.error("[save-all] Save failed - update returned false");
      notification({ message: "Save failed", success: false });
    }
  } catch (e) {
    console.error("[save-all] Exception during save:", e);
    console.error("[save-all] Error details:", {
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
    notification({ message: "Save failed", success: false });
  }
}

/**
 * Sync product price to the prices table
 * If the product has a price_id_primary, update that price record
 * Otherwise, create a new price record and link it to the product
 */
async function syncProductPrice({
  productId,
  organizationId,
  priceIdPrimary,
  newPrice,
  currency,
}: {
  productId?: string;
  organizationId?: string;
  priceIdPrimary?: string;
  newPrice: unknown;
  currency: string;
}) {
  if (!productId) {
    console.warn("[save-all] Cannot sync price: missing productId");
    return;
  }

  const priceAmount = String(newPrice);

  try {
    if (priceIdPrimary) {
      // Update existing price record
      await updateDataViaAthena({
        table_name: "prices",
        schema: "public",
        x_column: "price_id",
        x_id: priceIdPrimary,
        update_body: {
          amount: priceAmount,
        },
      });
    } else {
      // Create new price record and link to product

      const insertResponse = await insertDataViaAthena({
        table_name: "prices",
        schema: "public",
        insert_body: {
          amount: priceAmount,
          currency: currency,
          product_id: productId,
          organization_id: organizationId,
          charge_model: "one-off",
        },
      });

      if (insertResponse.error) {
        console.error(
          "[save-all] Failed to create price record:",
          insertResponse.error,
        );
        return;
      }

      const createdPrice = insertResponse.data as {
        price_id?: string;
        priceId?: string;
      } | null;
      const newPriceId = createdPrice?.price_id || createdPrice?.priceId;

      if (newPriceId) {
        // Link the new price to the product
        await updateDataViaAthena({
          table_name: "products",
          schema: "public",
          x_column: "product_id",
          x_id: productId,
          update_body: {
            price_id_primary: newPriceId,
          },
        });
      }
    }
  } catch (priceError) {
    console.error("[save-all] Error syncing price:", priceError);
    // Don't throw - the main product update succeeded, price sync is secondary
  }
}
