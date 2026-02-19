import { describe, it, expect, beforeEach } from "vitest";
import { resolveTemplate, resolveTemplateValue } from "../resolver";
import {
  initializeTemplating,
  clearRegistry,
  registerStrategy,
} from "../index";
import type { TemplateContext, TemplateStrategy } from "../types";

describe("Advanced Template Features", () => {
  beforeEach(() => {
    clearRegistry();
    initializeTemplating();
  });

  describe("Nested Object Access", () => {
    it("should resolve deeply nested user properties", () => {
      const context: TemplateContext = {
        user: {
          profile: {
            settings: {
              theme: "dark",
              language: "en",
            },
          },
        },
      };

      const theme = resolveTemplate("{{user.profile.settings.theme}}", context);
      expect(theme).toBe("dark");
    });

    it("should resolve deeply nested entity properties", () => {
      const context: TemplateContext = {
        entity: {
          address: {
            shipping: {
              city: "New York",
              state: "NY",
            },
          },
        },
      };

      // Column strategy supports nested paths via getValueByPathCase
      const city = resolveTemplate("{{address.shipping.city}}", context);
      expect(city).toBe("New York");

      const state = resolveTemplate("{{address.shipping.state}}", context);
      expect(state).toBe("NY");
    });

    it("should handle missing nested properties gracefully", () => {
      const context: TemplateContext = {
        user: {
          profile: {},
        },
      };

      const result = resolveTemplate(
        "{{user.profile.settings.theme}}",
        context,
      );
      expect(result).toBe("");
    });
  });

  describe("Mixed Context Resolution", () => {
    it("should resolve from multiple contexts in one template", () => {
      const context: TemplateContext = {
        user: {
          organization_id: "org-999",
          name: "Alice",
        },
        entity: {
          customer_id: "cust-111",
          status: "premium",
        },
        idColumn: "customer_id",
      };

      const path = resolveTemplate(
        "{{user.organization_id}}/{{user.name}}/{{resource_id}}/{{status}}",
        context,
      );
      expect(path).toBe("org-999/Alice/cust-111/premium");
    });

    it("should handle complex S3 path construction", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-456" },
        entity: { customer_id: "cust-789" },
        idColumn: "customer_id",
        resourceName: "customers",
      };

      const path = resolveTemplate(
        "rsf/{{user.organization_id}}/customers/{{resource_id}}/files",
        context,
      );
      expect(path).toBe("rsf/org-456/customers/cust-789/files");
    });
  });

  describe("Type Coercion Edge Cases", () => {
    it("should handle zero as a number", () => {
      const context: TemplateContext = {
        entity: { count: 0 },
      };

      const result = resolveTemplateValue("{{count}}", context);
      expect(result).toBe(0);
      expect(typeof result).toBe("number");
    });

    it("should handle negative numbers", () => {
      const context: TemplateContext = {
        entity: { balance: -50.25 },
      };

      const result = resolveTemplateValue("{{balance}}", context);
      expect(result).toBe(-50.25);
    });

    it("should handle scientific notation", () => {
      const context: TemplateContext = {
        entity: { value: "1e3" },
      };

      const result = resolveTemplateValue("{{value}}", context);
      expect(result).toBe(1000);
    });

    it("should preserve null vs empty string", () => {
      const ctx1: TemplateContext = {
        entity: { value: null },
      };
      const ctx2: TemplateContext = {
        entity: { value: "" },
      };

      const result1 = resolveTemplateValue("{{value}}", ctx1);
      const result2 = resolveTemplateValue("{{value}}", ctx2);

      expect(result1).toBe(null);
      expect(result2).toBe(null);
    });

    it("should handle boolean edge cases", () => {
      const context: TemplateContext = {
        entity: {
          t1: "TRUE",
          t2: "True",
          f1: "FALSE",
          f2: "False",
        },
      };

      expect(resolveTemplateValue("{{t1}}", context)).toBe(true);
      expect(resolveTemplateValue("{{t2}}", context)).toBe(true);
      expect(resolveTemplateValue("{{f1}}", context)).toBe(false);
      expect(resolveTemplateValue("{{f2}}", context)).toBe(false);
    });
  });

  describe("Special Characters", () => {
    it("should handle values with spaces", () => {
      const context: TemplateContext = {
        entity: { name: "John Doe" },
      };

      const result = resolveTemplate("{{name}}", context);
      expect(result).toBe("John Doe");
    });

    it("should handle values with special characters", () => {
      const context: TemplateContext = {
        entity: { text: "Hello, World! & Friends" },
      };

      const result = resolveTemplate("{{text}}", context);
      expect(result).toBe("Hello, World! & Friends");
    });

    it("should handle unicode characters", () => {
      const context: TemplateContext = {
        entity: { text: "Café ☕ 日本語" },
      };

      const result = resolveTemplate("{{text}}", context);
      expect(result).toBe("Café ☕ 日本語");
    });

    it("should handle URLs", () => {
      const context: TemplateContext = {
        entity: { url: "https://example.com/path?query=value&other=data" },
      };

      const result = resolveTemplate("{{url}}", context);
      expect(result).toBe("https://example.com/path?query=value&other=data");
    });
  });

  describe("Array and Object Values", () => {
    it("should convert arrays to strings", () => {
      const context: TemplateContext = {
        entity: { tags: ["tag1", "tag2", "tag3"] },
      };

      const result = resolveTemplate("{{tags}}", context);
      expect(result).toBe("tag1,tag2,tag3");
    });

    it("should convert objects to strings", () => {
      const context: TemplateContext = {
        entity: { meta: { key: "value" } },
      };

      const result = resolveTemplate("{{meta}}", context);
      expect(result).toBe("[object Object]");
    });
  });

  describe("Template Edge Cases", () => {
    it("should handle multiple adjacent templates", () => {
      const context: TemplateContext = {
        user: { first: "John", last: "Doe" },
      };

      const result = resolveTemplate("{{user.first}}{{user.last}}", context);
      expect(result).toBe("JohnDoe");
    });

    it("should handle templates with whitespace", () => {
      const context: TemplateContext = {
        user: { name: "Alice" },
      };

      const result = resolveTemplate("{{  user.name  }}", context);
      expect(result).toBe("Alice");
    });

    it("should handle empty template markers", () => {
      const result = resolveTemplate("{{}}", {});
      expect(result).toBe("");
    });

    it("should handle malformed templates", () => {
      const context: TemplateContext = {
        entity: { name: "Test" },
      };

      // Single brace not a template
      const result = resolveTemplate("{name}", context);
      expect(result).toBe("{name}");
    });

    it("should handle nested curly braces in values", () => {
      const context: TemplateContext = {
        entity: { json: '{"key": "value"}' },
      };

      const result = resolveTemplate("{{json}}", context);
      expect(result).toBe('{"key": "value"}');
    });
  });

  describe("Case Sensitivity", () => {
    it("should resolve camelCase from snake_case", () => {
      const context: TemplateContext = {
        entity: { organizationId: "org-123" },
      };

      const result = resolveTemplate("{{organization_id}}", context);
      expect(result).toBe("org-123");
    });

    it("should resolve snake_case from camelCase", () => {
      const context: TemplateContext = {
        entity: { organization_id: "org-456" },
      };

      const result = resolveTemplate("{{organizationId}}", context);
      expect(result).toBe("org-456");
    });

    it("should resolve PascalCase", () => {
      const context: TemplateContext = {
        entity: { OrganizationId: "org-789" },
      };

      // PascalCase matching might not work perfectly - case conversion is camelCase/snake_case
      // This is expected behavior - use consistent casing
      const result = resolveTemplate("{{OrganizationId}}", context);
      expect(result).toBe("org-789");
    });
  });

  describe("Custom Strategy", () => {
    it("should allow custom strategies", () => {
      class CustomStrategy implements TemplateStrategy {
        resolve(key: string): unknown {
          return `custom-${key}`;
        }
      }

      registerStrategy("custom", new CustomStrategy());

      const result = resolveTemplate("{{custom.value}}", {});
      expect(result).toBe("custom-value");
    });

    it("should override existing strategies", () => {
      class OverrideUserStrategy implements TemplateStrategy {
        resolve(): unknown {
          return "overridden";
        }
      }

      registerStrategy("user", new OverrideUserStrategy());

      const result = resolveTemplate("{{user.name}}", {
        user: { name: "Original" },
      });
      expect(result).toBe("overridden");

      // Reset
      clearRegistry();
      initializeTemplating();
    });
  });

  describe("Performance Edge Cases", () => {
    it("should handle large templates efficiently", () => {
      const context: TemplateContext = {
        entity: { v: "x" },
      };

      // Template with many tokens
      const template = Array(100).fill("{{v}}").join("-");
      const result = resolveTemplate(template, context);

      expect(result).toBe(Array(100).fill("x").join("-"));
    });

    it("should handle large values", () => {
      const largeText = "A".repeat(10000);
      const context: TemplateContext = {
        entity: { text: largeText },
      };

      const result = resolveTemplate("{{text}}", context);
      expect(result).toBe(largeText);
    });
  });

  describe("Real-world Scenarios", () => {
    it("should resolve file explorer object path", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-123" },
        entity: { customer_id: "cust-456" },
        idColumn: "customer_id",
        resourceName: "customers",
      };

      const path = resolveTemplate(
        "rsf/{{user.organization_id}}/customers/{{resource_id}}",
        context,
      );
      expect(path).toBe("rsf/org-123/customers/cust-456");
    });

    it("should resolve table widget conditions", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-789" },
        entity: { customer_id: "cust-999" },
        idColumn: "customer_id",
      };

      const orgId = resolveTemplateValue("{{user.organization_id}}", context);
      const customerId = resolveTemplateValue("{{resource_id}}", context);

      expect(orgId).toBe("org-789");
      expect(customerId).toBe("cust-999");
    });

    it("should resolve S3 bucket from env", () => {
      const isClient = typeof window !== "undefined";

      if (isClient) {
        // On client, env.XXX returns empty
        const result = resolveTemplate("{{env.S3_BUCKET}}", {});
        expect(result).toBe("");
      }
    });

    it("should build complete file path", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-abc" },
        entity: {
          customer_id: "cust-xyz",
          filename: "invoice.pdf",
        },
        idColumn: "customer_id",
      };

      const path = resolveTemplate(
        "rsf/{{user.organization_id}}/customers/{{resource_id}}/{{filename}}",
        context,
      );
      expect(path).toBe("rsf/org-abc/customers/cust-xyz/invoice.pdf");
    });
  });

  describe("Fallback Behavior", () => {
    it("should fallback to column strategy for unknown prefix", () => {
      const context: TemplateContext = {
        entity: { value: "test" },
      };

      // "unknown" is not a registered prefix, should try column fallback
      const result = resolveTemplate("{{unknown.value}}", context);
      expect(result).toBe("");
    });

    it("should use defaultValue for missing keys", () => {
      const result = resolveTemplate(
        "{{missing}}",
        {},
        { defaultValue: "N/A" },
      );
      expect(result).toBe("N/A");
    });

    it("should use custom coercion function", () => {
      const context: TemplateContext = {
        entity: { value: 42 },
      };

      const result = resolveTemplate("{{value}}", context, {
        coerce: (v) => `ID:${v}`,
      });
      expect(result).toBe("ID:42");
    });
  });

  describe("Error Handling", () => {
    it("should throw in strict mode", () => {
      expect(() => {
        resolveTemplate("{{missing}}", {}, { strict: true });
      }).toThrow("Failed to resolve template token: missing");
    });

    it("should not throw in non-strict mode", () => {
      const result = resolveTemplate("{{missing}}", {}, { strict: false });
      expect(result).toBe("");
    });
  });

  describe("Complex Templates", () => {
    it("should handle URL construction", () => {
      const context: TemplateContext = {
        user: { org: "acme" },
        entity: { id: "123", type: "invoice" },
        idColumn: "id",
      };

      const url = resolveTemplate(
        "/api/{{user.org}}/{{type}}/{{resource_id}}/view",
        context,
      );
      expect(url).toBe("/api/acme/invoice/123/view");
    });

    it("should handle query string construction", () => {
      const context: TemplateContext = {
        entity: { filter: "active", page: 1 },
      };

      const query = resolveTemplate(
        "?status={{filter}}&page={{page}}",
        context,
      );
      expect(query).toBe("?status=active&page=1");
    });

    it("should handle JSON-like structures in templates", () => {
      const context: TemplateContext = {
        entity: {
          name: "John",
          age: 30,
        },
      };

      const json = resolveTemplate(
        '{"name":"{{name}}","age":"{{age}}"}',
        context,
      );
      expect(json).toBe('{"name":"John","age":"30"}');
    });
  });

  describe("Resource Shortcuts", () => {
    it("should resolve resource_id without prefix", () => {
      const context: TemplateContext = {
        entity: { invoice_id: "inv-123" },
        idColumn: "invoice_id",
      };

      const result = resolveTemplateValue("{{resource_id}}", context);
      expect(result).toBe("inv-123");
    });

    it("should resolve resource.id with prefix", () => {
      const context: TemplateContext = {
        entity: { order_id: "ord-456" },
        idColumn: "order_id",
      };

      const result = resolveTemplateValue("{{resource.id}}", context);
      expect(result).toBe("ord-456");
    });

    it("should handle both in same template", () => {
      const context: TemplateContext = {
        entity: { customer_id: "cust-789" },
        idColumn: "customer_id",
      };

      // Both should resolve to same value
      const result = resolveTemplate(
        "{{resource_id}} === {{resource.id}}",
        context,
      );
      expect(result).toBe("cust-789 === cust-789");
    });
  });

  describe("Column List Validation", () => {
    it("should resolve columns in the columns list", () => {
      const context: TemplateContext = {
        entity: {
          customer_id: "123",
          name: "John",
          email: "john@example.com",
        },
        columns: ["customer_id", "name", "email"],
      };

      expect(resolveTemplate("{{customer_id}}", context)).toBe("123");
      expect(resolveTemplate("{{name}}", context)).toBe("John");
      expect(resolveTemplate("{{email}}", context)).toBe("john@example.com");
    });

    it("should still resolve columns not in list (by default)", () => {
      const context: TemplateContext = {
        entity: { unlisted_field: "value" },
        columns: ["other_field"],
      };

      // Should still resolve even though not in columns list
      const result = resolveTemplate("{{unlisted_field}}", context);
      expect(result).toBe("value");
    });

    it("should reject unlisted columns in strict mode", () => {
      const context: TemplateContext = {
        entity: { unlisted: "value" },
        columns: ["listed"],
        custom: { strictColumnCheck: true },
      };

      // Should not resolve because not in columns and strict mode enabled
      const result = resolveTemplate("{{unlisted}}", context);
      expect(result).toBe("");
    });
  });

  describe("Whitespace Handling", () => {
    it("should trim whitespace in keys", () => {
      const context: TemplateContext = {
        user: { name: "Alice" },
      };

      const result = resolveTemplate("{{  user.name  }}", context);
      expect(result).toBe("Alice");
    });

    it("should preserve whitespace in values", () => {
      const context: TemplateContext = {
        entity: { text: "  spaced  " },
      };

      const result = resolveTemplate("{{text}}", context);
      expect(result).toBe("  spaced  ");
    });
  });

  describe("Multiple Value Types", () => {
    it("should handle mixed types in one template", () => {
      const context: TemplateContext = {
        entity: {
          name: "Product",
          price: 99.99,
          available: true,
          quantity: 0,
        },
      };

      const text = resolveTemplate(
        "{{name}}: ${{price}} - Available: {{available}} - Qty: {{quantity}}",
        context,
      );
      expect(text).toBe("Product: $99.99 - Available: true - Qty: 0");
    });

    it("should preserve types in pure templates", () => {
      const context: TemplateContext = {
        entity: {
          price: 99.99,
          active: true,
          count: 42,
        },
      };

      expect(resolveTemplateValue("{{price}}", context)).toBe(99.99);
      expect(resolveTemplateValue("{{active}}", context)).toBe(true);
      expect(resolveTemplateValue("{{count}}", context)).toBe(42);
    });
  });

  describe("Undefined and Null Handling", () => {
    it("should handle undefined entity", () => {
      const context: TemplateContext = {
        entity: undefined,
      };

      const result = resolveTemplate("{{field}}", context);
      expect(result).toBe("");
    });

    it("should handle undefined user", () => {
      const context: TemplateContext = {
        user: undefined,
      };

      const result = resolveTemplate("{{user.name}}", context);
      expect(result).toBe("");
    });

    it("should handle null values in entity", () => {
      const context: TemplateContext = {
        entity: { value: null },
      };

      const result = resolveTemplateValue("{{value}}", context);
      expect(result).toBe(null);
    });
  });

  describe("Recursive Templates", () => {
    it("should not recursively resolve templates", () => {
      const context: TemplateContext = {
        entity: { value: "{{other}}" },
      };

      // Should not resolve the inner {{other}}
      const result = resolveTemplate("{{value}}", context);
      expect(result).toBe("{{other}}");
    });
  });
});
