import { describe, it, expect, beforeEach } from "vitest";
import { resolveTemplate, resolveTemplateValue } from "../resolver";
import { initializeTemplating, clearRegistry } from "../index";
import type { TemplateContext } from "../types";

describe("Template System", () => {
  beforeEach(() => {
    clearRegistry();
    initializeTemplating();
  });

  describe("EnvStrategy", () => {
    it("should return empty string on client-side", () => {
      // Client-side test (window exists in vitest)
      const result = resolveTemplate("{{env.TEST_VAR}}", {});
      expect(result).toBe("");
    });

    it("should resolve environment variables on server", () => {
      // This test would pass in a Node.js environment without window
      // In vitest with jsdom, window exists so env vars aren't accessible
      const isClient = typeof window !== "undefined";

      if (!isClient && typeof process !== "undefined" && process.env) {
        process.env.TEST_VAR = "test-value";

        const result = resolveTemplate("{{env.TEST_VAR}}", {});
        expect(result).toBe("test-value");

        delete process.env.TEST_VAR;
      } else {
        // Client-side should return empty
        expect(resolveTemplate("{{env.ANY}}", {})).toBe("");
      }
    });

    it("should respect whitelist when provided", () => {
      const isClient = typeof window !== "undefined";

      if (!isClient && typeof process !== "undefined" && process.env) {
        process.env.ALLOWED = "yes";
        process.env.BLOCKED = "no";

        const context: TemplateContext = {
          allowedEnvVars: ["ALLOWED"],
        };

        const allowed = resolveTemplate("{{env.ALLOWED}}", context);
        const blocked = resolveTemplate("{{env.BLOCKED}}", context);

        expect(allowed).toBe("yes");
        expect(blocked).toBe("");

        delete process.env.ALLOWED;
        delete process.env.BLOCKED;
      } else {
        // Client-side should return empty regardless of whitelist
        const context: TemplateContext = {
          allowedEnvVars: ["ALLOWED"],
        };
        expect(resolveTemplate("{{env.ALLOWED}}", context)).toBe("");
      }
    });
  });

  describe("UserStrategy", () => {
    it("should resolve user properties", () => {
      const context: TemplateContext = {
        user: {
          organization_id: "org-123",
          name: "John Doe",
        },
      };

      const result = resolveTemplate("{{user.organization_id}}", context);
      expect(result).toBe("org-123");
    });

    it("should resolve nested user properties", () => {
      const context: TemplateContext = {
        user: {
          profile: {
            name: "Jane Smith",
            email: "jane@example.com",
          },
        },
      };

      const result = resolveTemplate("{{user.profile.email}}", context);
      expect(result).toBe("jane@example.com");
    });

    it("should handle case-insensitive property access", () => {
      const context: TemplateContext = {
        user: {
          organizationId: "org-456",
        },
      };

      const result = resolveTemplate("{{user.organization_id}}", context);
      expect(result).toBe("org-456");
    });
  });

  describe("ResourceStrategy", () => {
    it("should resolve resource.id to the idColumn value", () => {
      const context: TemplateContext = {
        entity: { customer_id: "cust-789" },
        idColumn: "customer_id",
      };

      const result = resolveTemplate("{{resource.id}}", context);
      expect(result).toBe("cust-789");
    });

    it("should resolve resource_id shorthand", () => {
      const context: TemplateContext = {
        entity: { invoice_id: "inv-999" },
        idColumn: "invoice_id",
      };

      const result = resolveTemplate("{{resource_id}}", context);
      expect(result).toBe("inv-999");
    });

    it("should resolve other resource properties", () => {
      const context: TemplateContext = {
        entity: {
          customer_id: "cust-123",
          customer_name: "Acme Corp",
        },
        idColumn: "customer_id",
      };

      const result = resolveTemplate("{{resource.customer_name}}", context);
      expect(result).toBe("Acme Corp");
    });
  });

  describe("ColumnStrategy", () => {
    it("should resolve unprefixed column names", () => {
      const context: TemplateContext = {
        entity: {
          customer_id: "cust-456",
          status: "active",
        },
        columns: ["customer_id", "status"],
      };

      const result = resolveTemplate("{{customer_id}}", context);
      expect(result).toBe("cust-456");
    });

    it("should handle case-insensitive column access", () => {
      const context: TemplateContext = {
        entity: {
          organizationId: "org-789",
        },
      };

      const result = resolveTemplate("{{organization_id}}", context);
      expect(result).toBe("org-789");
    });
  });

  describe("Mixed Templates", () => {
    it("should resolve complex multi-prefix templates", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-123" },
        entity: { customer_id: "cust-456" },
        idColumn: "customer_id",
      };

      const result = resolveTemplate(
        "rsf/{{user.organization_id}}/customers/{{resource_id}}",
        context,
      );
      expect(result).toBe("rsf/org-123/customers/cust-456");
    });

    it("should handle multiple tokens in one template", () => {
      const context: TemplateContext = {
        user: { name: "John" },
        entity: { status: "pending" },
      };

      const result = resolveTemplate(
        "User {{user.name}} has status {{status}}",
        context,
      );
      expect(result).toBe("User John has status pending");
    });
  });

  describe("Type Coercion", () => {
    it("should preserve number types in pure templates", () => {
      const context: TemplateContext = {
        entity: { count: 42 },
      };

      const result = resolveTemplateValue("{{count}}", context);
      expect(result).toBe(42);
      expect(typeof result).toBe("number");
    });

    it("should preserve boolean types in pure templates", () => {
      const context: TemplateContext = {
        entity: { is_active: true },
      };

      const result = resolveTemplateValue("{{is_active}}", context);
      expect(result).toBe(true);
      expect(typeof result).toBe("boolean");
    });

    it("should coerce numeric strings to numbers", () => {
      const context: TemplateContext = {
        entity: { price: "99.99" },
      };

      const result = resolveTemplateValue("{{price}}", context);
      expect(result).toBe(99.99);
    });

    it("should coerce boolean strings", () => {
      const context: TemplateContext = {
        entity: { flag: "true" },
      };

      const result = resolveTemplateValue("{{flag}}", context);
      expect(result).toBe(true);
    });

    it("should return strings for mixed templates", () => {
      const context: TemplateContext = {
        entity: { count: 5 },
      };

      const result = resolveTemplateValue("Count: {{count}}", context);
      expect(result).toBe("Count: 5");
      expect(typeof result).toBe("string");
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing values gracefully", () => {
      const context: TemplateContext = {
        entity: { name: "Test" },
      };

      const result = resolveTemplate("{{missing_field}}", context);
      expect(result).toBe("");
    });

    it("should handle empty context", () => {
      const result = resolveTemplate("{{user.name}}", {});
      expect(result).toBe("");
    });

    it("should handle templates without tokens", () => {
      const result = resolveTemplate("Plain text", {});
      expect(result).toBe("Plain text");
    });

    it("should handle null and undefined values", () => {
      const context: TemplateContext = {
        entity: { value: null },
      };

      const result = resolveTemplateValue("{{value}}", context);
      expect(result).toBe(null);
    });

    it("should handle empty strings", () => {
      const context: TemplateContext = {
        entity: { text: "" },
      };

      const result = resolveTemplateValue("{{text}}", context);
      expect(result).toBe(null);
    });
  });

  describe("Options", () => {
    it("should use defaultValue for missing keys", () => {
      const result = resolveTemplate(
        "{{missing}}",
        {},
        { defaultValue: "N/A" },
      );
      expect(result).toBe("N/A");
    });

    it("should throw in strict mode for missing keys", () => {
      expect(() => {
        resolveTemplate("{{missing}}", {}, { strict: true });
      }).toThrow();
    });

    it("should preserve types when preserveTypes is true", () => {
      const context: TemplateContext = {
        entity: { count: 42 },
      };

      const result = resolveTemplateValue("{{count}}", context, {
        preserveTypes: true,
      });
      expect(result).toBe(42);
    });

    it("should force strings when preserveTypes is false", () => {
      const context: TemplateContext = {
        entity: { count: 42 },
      };

      const result = resolveTemplate("{{count}}", context, {
        preserveTypes: false,
      });
      expect(result).toBe("42");
      expect(typeof result).toBe("string");
    });
  });
});
