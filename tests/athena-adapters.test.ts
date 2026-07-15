import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const storageUploadMock = vi.fn();
const storageProxyUrlMock = vi.fn();
const storageListMock = vi.fn();
const createAthenaBrowserClientMock = vi.fn(() => ({
  from: fromMock,
  storage: {
    file: {
      upload: storageUploadMock,
      proxyUrl: storageProxyUrlMock,
      list: storageListMock,
    },
  },
}));

vi.mock("@xylex-group/athena/next/client", () => ({
  createAthenaBrowserClient: createAthenaBrowserClientMock,
}));

vi.mock("@/lib/config", () => ({
  APP_CONFIG: {
    athena: {
      db_api_url: "https://athena-db.com",
      standard_client: "railway_direct",
      api_key: "test-key",
    },
  },
}));

describe("Athena adapters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps fetchDataViaAthena to the Athena SDK query builder", async () => {
    const select = vi.fn().mockResolvedValue({
      data: [{ customer_id: "cust-1" }],
      error: null,
    });
    const limit = vi.fn(() => ({ select }));
    const offset = vi.fn(() => ({ limit, select }));
    const order = vi.fn(() => ({ offset, limit, select }));
    const eq = vi.fn(() => ({ order, offset, limit, select }));
    fromMock.mockReturnValue({ eq, order, offset, limit, select });

    const { fetchDataViaAthena } = await import(
      "@/packages/resource-framework/adapters/athena-gateway"
    );

    const result = await fetchDataViaAthena({
      table_name: "customers",
      columns: ["customer_id", "name"],
      conditions: [{ eq_column: "organization_id", eq_value: "org-1" }],
      limit: 10,
      offset: 20,
      order_by: "created_at desc",
    }, {
      headers: { "X-Organization-Id": "org-1" },
    });

    expect(createAthenaBrowserClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://athena-db.com",
        key: "test-key",
        client: "railway_direct",
        headers: expect.objectContaining({
          "X-Organization-Id": "org-1",
          "X-Request-Id": expect.any(String),
        }),
      }),
    );
    expect(fromMock).toHaveBeenCalledWith("customers");
    expect(eq).toHaveBeenCalledWith("organization_id", "org-1");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(offset).toHaveBeenCalledWith(20);
    expect(limit).toHaveBeenCalledWith(10);
    expect(select).toHaveBeenCalledWith("customer_id, name");
    expect(result).toEqual({
      data: [{ customer_id: "cust-1" }],
      error: null,
    });
  });

  it("normalizes single-row mutations from the Athena SDK", async () => {
    const select = vi.fn().mockResolvedValue({
      data: [{ customer_id: "cust-1", status: "active" }],
      error: null,
    });
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq, select }));
    fromMock.mockReturnValue({ update });

    const { updateDataViaAthena } = await import(
      "@/packages/resource-framework/adapters/athena-gateway"
    );

    const result = await updateDataViaAthena({
      table_name: "customers",
      x_column: "customer_id",
      x_id: "cust-1",
      update_body: { status: "active" },
    });

    expect(fromMock).toHaveBeenCalledWith("customers");
    expect(update).toHaveBeenCalledWith({ status: "active" });
    expect(eq).toHaveBeenCalledWith("customer_id", "cust-1");
    expect(result).toEqual({
      data: { customer_id: "cust-1", status: "active" },
      error: null,
    });
  });

  it("uses Athena managed storage for upload and signed proxy URLs", async () => {
    storageUploadMock.mockResolvedValue({
      files: [{
        file: {
          id: "file-1",
          bucket: "suitsconnect",
          storage_key: "rsf/org-1/customers/cust-1/file.txt",
        },
        storage_key: "rsf/org-1/customers/cust-1/file.txt",
      }],
      count: 1,
    });
    storageProxyUrlMock.mockResolvedValue({
      url: "https://athena-db.com/storage/files/file-1/proxy?token=fresh",
      expires_in: 3600,
    });

    const { refreshFileUrlViaAthena, uploadFileViaAthena } = await import(
      "@/packages/resource-framework/adapters/athena-files"
    );

    const file = new Blob(["hello"], { type: "text/plain" });
    const uploadResult = await uploadFileViaAthena({
      s3_id: "s3-1",
      files: file,
      fileName: "file.txt",
      organizationId: "org-1",
      prefixPath: "rsf/org-1/customers/cust-1",
    });
    const refreshResult = await refreshFileUrlViaAthena({
      fileId: "file-1",
    });

    expect(storageUploadMock).toHaveBeenCalledWith(expect.objectContaining({
      s3_id: "s3-1",
      files: file,
      fileName: "file.txt",
    }));
    expect(storageProxyUrlMock).toHaveBeenCalledWith("file-1", {
      purpose: "stream",
    });
    expect(uploadResult.files[0]?.storage_key).toBe(
      "rsf/org-1/customers/cust-1/file.txt",
    );
    expect(refreshResult.url).toContain("token=fresh");
  });
});
