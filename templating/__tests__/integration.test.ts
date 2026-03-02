import { describe, it, expect, beforeEach } from "vitest";
import { resolveTemplate, resolveTemplateValue } from "../resolver";
import { initializeTemplating, clearRegistry } from "../index";
import type { TemplateContext } from "../types";

describe("Integration Tests", () => {
  beforeEach(() => {
    clearRegistry();
    initializeTemplating();
  });

  describe("File Explorer Widget Scenarios", () => {
    it("should build complete S3 object path", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-123" },
        entity: { customer_id: "cust-456" },
        idColumn: "customer_id",
        resourceName: "customers",
      };

      const objectPath = resolveTemplate(
        "rsf/{{user.organization_id}}/customers/{{resource_id}}",
        context,
      );

      expect(objectPath).toBe("rsf/org-123/customers/cust-456");
    });

    it("should resolve file path with filename", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-abc" },
        entity: {
          customer_id: "cust-xyz",
          filename: "invoice.pdf",
        },
        idColumn: "customer_id",
      };

      const fullPath = resolveTemplate(
        "rsf/{{user.organization_id}}/customers/{{resource_id}}/{{filename}}",
        context,
      );

      expect(fullPath).toBe("rsf/org-abc/customers/cust-xyz/invoice.pdf");
    });

    it("should resolve widget conditions", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-999" },
        entity: { customer_id: "cust-111" },
        idColumn: "customer_id",
      };

      // Condition: { eq_column: 'customer_id', eq_value: '{{resource_id}}' }
      const customerId = resolveTemplateValue("{{resource_id}}", context);
      expect(customerId).toBe("cust-111");

      // Condition: { eq_column: 'organization_id', eq_value: '{{user.organization_id}}' }
      const orgId = resolveTemplateValue("{{user.organization_id}}", context);
      expect(orgId).toBe("org-999");
    });

    it("should handle multiple conditions", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-555" },
        entity: {
          customer_id: "cust-666",
          status: "active",
        },
        idColumn: "customer_id",
      };

      const conditions = [
        { eq_column: "customer_id", eq_value: "{{resource_id}}" },
        { eq_column: "organization_id", eq_value: "{{user.organization_id}}" },
        { eq_column: "status", eq_value: "{{status}}" },
      ];

      const resolved = conditions.map((c) => ({
        eq_column: c.eq_column,
        eq_value: resolveTemplateValue(c.eq_value, context),
      }));

      expect(resolved[0].eq_value).toBe("cust-666");
      expect(resolved[1].eq_value).toBe("org-555");
      expect(resolved[2].eq_value).toBe("active");
    });
  });

  describe("Table Widget Scenarios", () => {
    it("should resolve table widget resourceName", () => {
      const _context: TemplateContext = {
        resourceName: "invoices",
      };

      const name = resolveTemplate("{{resourceName}}", {
        entity: { resourceName: "invoices" },
      });
      expect(name).toBe("invoices");
    });

    it("should resolve nested table widget", () => {
      const parentContext: TemplateContext = {
        user: { organization_id: "org-123" },
        entity: { customer_id: "cust-456" },
        idColumn: "customer_id",
      };

      // Widget showing invoices for this customer
      const conditions = [
        {
          eq_column: "customer_id",
          eq_value: resolveTemplateValue("{{resource_id}}", parentContext),
        },
        {
          eq_column: "organization_id",
          eq_value: resolveTemplateValue(
            "{{user.organization_id}}",
            parentContext,
          ),
        },
      ];

      expect(conditions[0].eq_value).toBe("cust-456");
      expect(conditions[1].eq_value).toBe("org-123");
    });
  });

  describe("Drilldown Title Scenarios", () => {
    it("should resolve dynamic drilldown title", () => {
      const context: TemplateContext = {
        entity: {
          customer_id: "cust-789",
          name: "Acme Corp",
          status: "active",
        },
        idColumn: "customer_id",
      };

      const title = resolveTemplate("Customer: {{name}} ({{status}})", context);
      expect(title).toBe("Customer: Acme Corp (active)");
    });

    it("should resolve subtitle with user info", () => {
      const context: TemplateContext = {
        user: { name: "John Admin" },
        entity: { created_at: "2025-01-15" },
      };

      const subtitle = resolveTemplate(
        "Viewed by {{user.name}} | Created: {{created_at}}",
        context,
      );
      expect(subtitle).toBe("Viewed by John Admin | Created: 2025-01-15");
    });
  });

  describe("URL Construction", () => {
    it("should build drilldown URLs", () => {
      const context: TemplateContext = {
        entity: { customer_id: "cust-123" },
        idColumn: "customer_id",
        resourceName: "customers",
      };

      const url = resolveTemplate("/v2/customers/{{resource_id}}", context);
      expect(url).toBe("/v2/customers/cust-123");
    });

    it("should build API endpoints", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-456" },
        entity: { invoice_id: "inv-789" },
        idColumn: "invoice_id",
      };

      const endpoint = resolveTemplate(
        "/api/orgs/{{user.organization_id}}/invoices/{{resource_id}}",
        context,
      );
      expect(endpoint).toBe("/api/orgs/org-456/invoices/inv-789");
    });
  });

  describe("Multi-level Resource Navigation", () => {
    it("should handle parent-child resource relationships", () => {
      const customerContext: TemplateContext = {
        user: { organization_id: "org-123" },
        entity: { customer_id: "cust-456" },
        idColumn: "customer_id",
      };

      const invoiceContext: TemplateContext = {
        user: { organization_id: "org-123" },
        entity: {
          invoice_id: "inv-789",
          customer_id: "cust-456", // Foreign key
        },
        idColumn: "invoice_id",
      };

      // Customer drilldown path
      const customerPath = resolveTemplate(
        "customers/{{resource_id}}",
        customerContext,
      );
      expect(customerPath).toBe("customers/cust-456");

      // Invoice drilldown path with customer reference
      const invoicePath = resolveTemplate(
        "customers/{{customer_id}}/invoices/{{resource_id}}",
        invoiceContext,
      );
      expect(invoicePath).toBe("customers/cust-456/invoices/inv-789");
    });
  });

  describe("Batch Resolution", () => {
    it("should efficiently resolve multiple templates", () => {
      const context: TemplateContext = {
        user: { org: "org-1" },
        entity: {
          id: "123",
          name: "Test",
          status: "active",
          count: 5,
        },
        idColumn: "id",
      };

      const templates = [
        "{{user.org}}",
        "{{resource_id}}",
        "{{name}}",
        "{{status}}",
        "{{count}}",
      ];

      const results = templates.map((t) => resolveTemplate(t, context));

      expect(results).toEqual(["org-1", "123", "Test", "active", "5"]);
    });
  });

  describe("Condition Building", () => {
    it("should build filter conditions from templates", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-123", company_id: "comp-456" },
        entity: { customer_id: "cust-789", status: "premium" },
        idColumn: "customer_id",
      };

      const conditions = [
        { eq_column: "customer_id", eq_value: "{{resource_id}}" },
        { eq_column: "organization_id", eq_value: "{{user.organization_id}}" },
        { eq_column: "company_id", eq_value: "{{user.company_id}}" },
        { eq_column: "status", eq_value: "{{status}}" },
      ];

      const resolved = conditions.map((c) => ({
        eq_column: c.eq_column,
        eq_value: resolveTemplateValue(c.eq_value, context),
      }));

      expect(resolved).toEqual([
        { eq_column: "customer_id", eq_value: "cust-789" },
        { eq_column: "organization_id", eq_value: "org-123" },
        { eq_column: "company_id", eq_value: "comp-456" },
        { eq_column: "status", eq_value: "premium" },
      ]);
    });
  });

  describe("Real Configuration Examples", () => {
    it("should resolve customer file explorer config", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-abc" },
        entity: { customer_id: "cust-xyz" },
        idColumn: "customer_id",
      };

      const config = {
        table: "files",
        bucket: "suitsconnect",
        objectPath: resolveTemplate(
          "rsf/{{user.organization_id}}/customers/{{resource_id}}",
          context,
        ),
        conditions: [
          {
            eq_column: "customer_id",
            eq_value: resolveTemplateValue("{{resource_id}}", context),
          },
          {
            eq_column: "organization_id",
            eq_value: resolveTemplateValue("{{user.organization_id}}", context),
          },
        ],
      };

      expect(config.objectPath).toBe("rsf/org-abc/customers/cust-xyz");
      expect(config.conditions[0].eq_value).toBe("cust-xyz");
      expect(config.conditions[1].eq_value).toBe("org-abc");
    });

    it("should resolve invoice table widget config", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-123" },
        entity: { customer_id: "cust-456" },
        idColumn: "customer_id",
      };

      const widget = {
        type: "table",
        props: {
          resourceName: "invoices",
          conditions: [
            {
              eq_column: "customer_id",
              eq_value: resolveTemplateValue("{{resource_id}}", context),
            },
          ],
        },
      };

      expect(widget.props.conditions[0].eq_value).toBe("cust-456");
    });
  });

  describe("Default Value Scenarios", () => {
    it("should use default for missing user data", () => {
      const context: TemplateContext = {
        user: undefined,
      };

      const orgId = resolveTemplate("{{user.organization_id}}", context, {
        defaultValue: "default-org",
      });

      expect(orgId).toBe("default-org");
    });

    it("should use default for missing entity data", () => {
      const context: TemplateContext = {
        entity: {},
      };

      const status = resolveTemplate("{{status}}", context, {
        defaultValue: "pending",
      });

      expect(status).toBe("pending");
    });
  });

  describe("Complex Real-world Paths", () => {
    it("should build multi-segment S3 paths", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-prod-123" },
        entity: {
          customer_id: "cust-2025-001",
          invoice_id: "inv-jan-456",
          doc_type: "receipt",
        },
        idColumn: "customer_id",
      };

      const path = resolveTemplate(
        "rsf/{{user.organization_id}}/invoices/{{invoice_id}}/{{doc_type}}",
        context,
      );

      expect(path).toBe("rsf/org-prod-123/invoices/inv-jan-456/receipt");
    });

    it("should handle date-based paths", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-123" },
        entity: {
          customer_id: "cust-456",
          year: "2025",
          month: "01",
        },
        idColumn: "customer_id",
      };

      const path = resolveTemplate(
        "archives/{{user.organization_id}}/{{year}}/{{month}}/{{resource_id}}",
        context,
      );

      expect(path).toBe("archives/org-123/2025/01/cust-456");
    });
  });

  describe("Condition Type Preservation", () => {
    it("should preserve numeric condition values", () => {
      const context: TemplateContext = {
        entity: { amount: 1500, quantity: "25" },
      };

      const amount = resolveTemplateValue("{{amount}}", context);
      const quantity = resolveTemplateValue("{{quantity}}", context);

      expect(amount).toBe(1500);
      expect(typeof amount).toBe("number");

      expect(quantity).toBe(25);
      expect(typeof quantity).toBe("number");
    });

    it("should preserve boolean condition values", () => {
      const context: TemplateContext = {
        entity: { is_active: true, is_deleted: "false" },
      };

      const active = resolveTemplateValue("{{is_active}}", context);
      const deleted = resolveTemplateValue("{{is_deleted}}", context);

      expect(active).toBe(true);
      expect(typeof active).toBe("boolean");

      expect(deleted).toBe(false);
      expect(typeof deleted).toBe("boolean");
    });

    it("should handle null in conditions", () => {
      const context: TemplateContext = {
        entity: { parent_id: null },
      };

      const parentId = resolveTemplateValue("{{parent_id}}", context);
      expect(parentId).toBe(null);
    });
  });

  describe("Widget Configuration Resolution", () => {
    it("should resolve all widget props", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-123" },
        entity: {
          customer_id: "cust-456",
          name: "Acme Corp",
        },
        idColumn: "customer_id",
      };

      const widgetProps = {
        title: resolveTemplate("Files for {{name}}", context),
        objectPath: resolveTemplate(
          "rsf/{{user.organization_id}}/customers/{{resource_id}}",
          context,
        ),
        resourceIdColumn: resolveTemplate("customer_id", context),
        resourceName: resolveTemplate("customers", context),
      };

      expect(widgetProps.title).toBe("Files for Acme Corp");
      expect(widgetProps.objectPath).toBe("rsf/org-123/customers/cust-456");
      expect(widgetProps.resourceIdColumn).toBe("customer_id");
      expect(widgetProps.resourceName).toBe("customers");
    });
  });

  describe("Prefix Precedence", () => {
    it("should prioritize prefix-based resolution", () => {
      const context: TemplateContext = {
        user: { id: "user-123" },
        entity: { id: "entity-456" },
        idColumn: "id",
      };

      // user.id should resolve from user context
      const userId = resolveTemplate("{{user.id}}", context);
      expect(userId).toBe("user-123");

      // resource.id should resolve from entity idColumn
      const resourceId = resolveTemplate("{{resource.id}}", context);
      expect(resourceId).toBe("entity-456");

      // Unprefixed 'id' should resolve from entity
      const plainId = resolveTemplate("{{id}}", context);
      expect(plainId).toBe("entity-456");
    });

    it("should handle same property name in different contexts", () => {
      const context: TemplateContext = {
        user: { organization_id: "user-org" },
        entity: { organization_id: "entity-org" },
      };

      const userOrg = resolveTemplate("{{user.organization_id}}", context);
      const entityOrg = resolveTemplate("{{organization_id}}", context);

      expect(userOrg).toBe("user-org");
      expect(entityOrg).toBe("entity-org");
    });
  });

  describe("Empty and Whitespace Handling", () => {
    it("should handle leading/trailing spaces in templates", () => {
      const context: TemplateContext = {
        entity: { name: "Test" },
      };

      const result = resolveTemplate("  {{name}}  ", context);
      expect(result).toBe("  Test  ");
    });

    it("should handle empty string values", () => {
      const context: TemplateContext = {
        entity: { value: "" },
      };

      const result = resolveTemplateValue("{{value}}", context);
      expect(result).toBe(null);
    });

    it("should preserve intentional spacing in mixed templates", () => {
      const context: TemplateContext = {
        entity: { first: "John", last: "Doe" },
      };

      const name = resolveTemplate("{{first}} {{last}}", context);
      expect(name).toBe("John Doe");
    });
  });

  describe("Backward Compatibility", () => {
    it("should work with legacy dot-notation access", () => {
      const context: TemplateContext = {
        entity: {
          customer_id: "123",
          name: "Test",
        },
      };

      // Old style (still supported via column strategy)
      const id = resolveTemplate("{{customer_id}}", context);
      const name = resolveTemplate("{{name}}", context);

      expect(id).toBe("123");
      expect(name).toBe("Test");
    });
  });

  describe("S3 Client Config Resolution", () => {
    it("should resolve S3 config from env (server-side)", () => {
      const isClient = typeof window !== "undefined";

      if (isClient) {
        // On client, env vars return empty
        const config = {
          bucket_name: resolveTemplate("{{env.S3_BUCKET}}", {}),
          access_key: resolveTemplate("{{env.S3_ACCESS_KEY}}", {}),
        };

        expect(config.bucket_name).toBe("");
        expect(config.access_key).toBe("");
      }
    });

    it("should mix static and template values in S3 config", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-123" },
      };

      const config = {
        bucket_name: "suitsconnect", // Static
        provider: "minio", // Static
        base_url: resolveTemplate(
          "https://{{user.organization_id}}.s3.example.com",
          context,
        ),
      };

      expect(config.bucket_name).toBe("suitsconnect");
      expect(config.provider).toBe("minio");
      expect(config.base_url).toBe("https://org-123.s3.example.com");
    });
  });
});
