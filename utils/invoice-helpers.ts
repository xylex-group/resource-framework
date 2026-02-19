type User = {
  user_id: string;
  company_id: string;
  organization_id: string;
};

type Invoice = {
  invoice_id?: string;
  invoiceId?: string;
  [key: string]: unknown;
};

type LineItem = {
  id?: string | number;
  description?: string;
  quantity?: number | string;
  unitPrice?: number | string;
  amount?: number | string;
  [key: string]: unknown;
};

type Router = {
  push: (path: string) => void;
  replace?: (path: string) => void;
  back?: () => void;
  [key: string]: unknown;
};

type InitInvoiceResult = {
  error?: string;
  data: Invoice | null;
  message?: string | null;
};

/**
 * Helper function to handle invoice creation
 * This is a wrapper around the invoice initialization and navigation logic
 */
export async function handleCreateInvoice(params: {
  user: User;
  clearState: () => void;
  setInvoice: (invoice: Invoice | null) => void;
  setLineItems: (items: LineItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  router: Router;
  initInvoiceFn: (
    user_id: string,
    company_id: string,
    organization_id: string,
    contactId?: string,
    partialInvoice?: Partial<Invoice>,
  ) => Promise<InitInvoiceResult>;
}) {
  const {
    user,
    clearState,
    setInvoice,
    setLineItems,
    setLoading,
    setError,
    router,
    initInvoiceFn,
  } = params;

  try {
    setLoading(true);
    clearState();

    const result = await initInvoiceFn(
      user.user_id,
      user.company_id,
      user.organization_id,
    );

    if (result.error || !result.data) {
      setError(result.error || "Failed to create invoice");
      setLoading(false);
      return;
    }

    setInvoice(result.data);
    setLineItems([]);
    setLoading(false);

    // Navigate to the invoice drilldown page
    const invoiceId = result.data.invoice_id;
    if (invoiceId) {
      router.push(`/invoices/${invoiceId}`);
    }
  } catch (error) {
    console.error("Error creating invoice:", error);
    setError(error instanceof Error ? error.message : "Unknown error");
    setLoading(false);
  }
}

