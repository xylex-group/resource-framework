import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function cx(...args: ClassValue[]) {
  return twMerge(clsx(...args));
}

export const focusRing = [
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  "outline-[hsl(var(--brand))]",
];

export const PAGE_EXIT_SCALE = 0.9;
export const PAGE_EXIT_DURATION_MS = 180;

export function startPageExitTransition({
  scale = PAGE_EXIT_SCALE,
  durationMs = PAGE_EXIT_DURATION_MS,
}: { scale?: number; durationMs?: number } = {}) {
  if (typeof document === "undefined") return Promise.resolve();

  // Keep values in sync with CSS vars in `app/globals.css`.
  const root = document.documentElement;
  root.style.setProperty("--page-exit-scale", String(scale));
  root.style.setProperty("--page-exit-duration", `${durationMs}ms`);
  root.dataset.pageExit = "true";

  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

export function clearPageExitTransition() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  delete root.dataset.pageExit;
}

/**
 * @deprecated Use Athena API Gateway for invoice total calculations instead.
 * This function will be removed in a future version.
 * See TODO.md Phase 2 for migration details.
 * 
 * Calculate invoice totals from line items
 * @param lineItems - Array of line items with amounts
 * @param _ - Unused parameter for backwards compatibility
 * @param amountPaid - Amount already paid (optional, defaults to 0)
 * @returns Object with subtotal, tax, and total
 */
export function calculateInvoiceTotals(
  lineItems: Array<{
    quantity?: number;
    unit_price?: number;
    tax_rate?: number;
    subtotal?: number;
    tax_amount?: number;
    total?: number;
  }>,
  _?: unknown,
  amountPaid: number = 0,
) {
  let subtotal = 0;
  let taxAmount = 0;
  let total = 0;

  for (const item of lineItems) {
    const itemSubtotal =
      item.subtotal ?? (item.quantity ?? 0) * (item.unit_price ?? 0);
    const itemTax =
      item.tax_amount ?? itemSubtotal * ((item.tax_rate ?? 0) / 100);
    const itemTotal = item.total ?? itemSubtotal + itemTax;

    subtotal += itemSubtotal;
    taxAmount += itemTax;
    total += itemTotal;
  }

  const amountDue = total;
  const amountRemaining = Math.max(0, total - amountPaid);

  return {
    subtotal,
    tax_amount: taxAmount,
    taxTotal: taxAmount, // Alias for backwards compatibility
    total,
    amountPaid,
    amountDue,
    amountRemaining,
  };
}

/**
 * @deprecated Use Athena API Gateway for quote total calculations instead.
 * This function will be removed in a future version.
 * See TODO.md Phase 2 for migration details.
 * 
 * Calculate quote totals from line items (alias for calculateInvoiceTotals)
 */
export const calculateQuoteTotals = calculateInvoiceTotals;
