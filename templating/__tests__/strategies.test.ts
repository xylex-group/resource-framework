import { describe, it, expect } from "vitest";
import { EnvStrategy } from "../strategies/env-strategy";
import { UserStrategy } from "../strategies/user-strategy";
import {
  ResourceStrategy,
  ResourceIdShorthandStrategy,
} from "../strategies/resource-strategy";
import { ColumnStrategy } from "../strategies/column-strategy";
import type { TemplateContext } from "../types";

describe("Strategy Unit Tests", () => {
  describe("EnvStrategy", () => {
    const strategy = new EnvStrategy();

    it("should return undefined on client-side", () => {
      const isClient = typeof window !== "undefined";

      if (isClient) {
        const result = strategy.resolve("ANY_VAR", {});
        expect(result).toBeUndefined();
      }
    });

    it("should respect whitelist", () => {
      const context: TemplateContext = {
        allowedEnvVars: ["ALLOWED"],
      };

      const isClient = typeof window !== "undefined";

      if (!isClient && typeof process !== "undefined") {
        process.env.ALLOWED = "yes";
        process.env.BLOCKED = "no";

        const allowed = strategy.resolve("ALLOWED", context);
        const blocked = strategy.resolve("BLOCKED", context);

        expect(allowed).toBe("yes");
        expect(blocked).toBeUndefined();

        delete process.env.ALLOWED;
        delete process.env.BLOCKED;
      }
    });

    it("should allow all vars when no whitelist provided", () => {
      const isClient = typeof window !== "undefined";

      if (!isClient && typeof process !== "undefined") {
        process.env.ANY_VAR = "value";

        const result = strategy.resolve("ANY_VAR", {});
        expect(result).toBe("value");

        delete process.env.ANY_VAR;
      }
    });
  });

  describe("UserStrategy", () => {
    const strategy = new UserStrategy();

    it("should resolve simple user properties", () => {
      const context: TemplateContext = {
        user: { name: "John", id: "123" },
      };

      expect(strategy.resolve("name", context)).toBe("John");
      expect(strategy.resolve("id", context)).toBe("123");
    });

    it("should resolve nested user properties", () => {
      const context: TemplateContext = {
        user: {
          profile: {
            email: "john@example.com",
            phone: "555-1234",
          },
        },
      };

      expect(strategy.resolve("profile.email", context)).toBe(
        "john@example.com",
      );
      expect(strategy.resolve("profile.phone", context)).toBe("555-1234");
    });

    it("should handle missing user", () => {
      const context: TemplateContext = {
        user: undefined,
      };

      expect(strategy.resolve("name", context)).toBeUndefined();
    });

    it("should handle missing properties", () => {
      const context: TemplateContext = {
        user: { name: "John" },
      };

      expect(strategy.resolve("email", context)).toBeUndefined();
    });

    it("should be case-insensitive", () => {
      const context: TemplateContext = {
        user: { organizationId: "org-123" },
      };

      expect(strategy.resolve("organization_id", context)).toBe("org-123");
      expect(strategy.resolve("organizationId", context)).toBe("org-123");
    });
  });

  describe("ResourceStrategy", () => {
    const strategy = new ResourceStrategy();

    it("should resolve resource.id to idColumn value", () => {
      const context: TemplateContext = {
        entity: { customer_id: "cust-456" },
        idColumn: "customer_id",
      };

      expect(strategy.resolve("id", context)).toBe("cust-456");
    });

    it("should resolve other resource properties", () => {
      const context: TemplateContext = {
        entity: {
          customer_id: "123",
          name: "Acme",
          status: "active",
        },
        idColumn: "customer_id",
      };

      expect(strategy.resolve("name", context)).toBe("Acme");
      expect(strategy.resolve("status", context)).toBe("active");
    });

    it("should handle missing entity", () => {
      const context: TemplateContext = {
        entity: undefined,
        idColumn: "id",
      };

      expect(strategy.resolve("id", context)).toBeUndefined();
    });

    it("should be case-insensitive", () => {
      const context: TemplateContext = {
        entity: { customerId: "123" },
        idColumn: "customerId",
      };

      expect(strategy.resolve("customer_id", context)).toBe("123");
    });
  });

  describe("ResourceIdShorthandStrategy", () => {
    const strategy = new ResourceIdShorthandStrategy();

    it("should resolve to idColumn value", () => {
      const context: TemplateContext = {
        entity: { invoice_id: "inv-789" },
        idColumn: "invoice_id",
      };

      expect(strategy.resolve("", context)).toBe("inv-789");
    });

    it("should handle missing idColumn", () => {
      const context: TemplateContext = {
        entity: { id: "123" },
        idColumn: undefined,
      };

      expect(strategy.resolve("", context)).toBeUndefined();
    });

    it("should handle missing entity", () => {
      const context: TemplateContext = {
        entity: undefined,
        idColumn: "id",
      };

      expect(strategy.resolve("", context)).toBeUndefined();
    });

    it("should work with any idColumn name", () => {
      const contexts = [
        { entity: { customer_id: "c1" }, idColumn: "customer_id" },
        { entity: { invoice_id: "i1" }, idColumn: "invoice_id" },
        { entity: { order_id: "o1" }, idColumn: "order_id" },
      ];

      expect(strategy.resolve("", contexts[0])).toBe("c1");
      expect(strategy.resolve("", contexts[1])).toBe("i1");
      expect(strategy.resolve("", contexts[2])).toBe("o1");
    });
  });

  describe("ColumnStrategy", () => {
    const strategy = new ColumnStrategy();

    it("should resolve direct column references", () => {
      const context: TemplateContext = {
        entity: {
          customer_id: "123",
          name: "Acme",
        },
      };

      expect(strategy.resolve("customer_id", context)).toBe("123");
      expect(strategy.resolve("name", context)).toBe("Acme");
    });

    it("should handle missing entity", () => {
      const context: TemplateContext = {
        entity: undefined,
      };

      expect(strategy.resolve("field", context)).toBeUndefined();
    });

    it("should be case-insensitive", () => {
      const context: TemplateContext = {
        entity: { organizationId: "org-999" },
      };

      expect(strategy.resolve("organization_id", context)).toBe("org-999");
      expect(strategy.resolve("organizationId", context)).toBe("org-999");
    });

    it("should check columns list when provided", () => {
      const context: TemplateContext = {
        entity: {
          listed: "yes",
          unlisted: "no",
        },
        columns: ["listed"],
      };

      // Both should resolve by default (non-strict mode)
      expect(strategy.resolve("listed", context)).toBe("yes");
      expect(strategy.resolve("unlisted", context)).toBe("no");
    });

    it("should enforce strict column check when enabled", () => {
      const context: TemplateContext = {
        entity: {
          listed: "yes",
          unlisted: "no",
        },
        columns: ["listed"],
        custom: { strictColumnCheck: true },
      };

      expect(strategy.resolve("listed", context)).toBe("yes");
      expect(strategy.resolve("unlisted", context)).toBeUndefined();
    });

    it("should handle case-insensitive column list matching", () => {
      const context: TemplateContext = {
        entity: { customerId: "123" },
        columns: ["customer_id"],
      };

      // Should match even though case differs
      expect(strategy.resolve("customerId", context)).toBe("123");
      expect(strategy.resolve("customer_id", context)).toBe("123");
    });
  });

  describe("Strategy Composition", () => {
    it("should work with different strategies in sequence", () => {
      const userStrategy = new UserStrategy();
      const resourceStrategy = new ResourceStrategy();
      const columnStrategy = new ColumnStrategy();

      const context: TemplateContext = {
        user: { org_id: "org-1" },
        entity: { customer_id: "cust-1", status: "active" },
        idColumn: "customer_id",
      };

      expect(userStrategy.resolve("org_id", context)).toBe("org-1");
      expect(resourceStrategy.resolve("id", context)).toBe("cust-1");
      expect(columnStrategy.resolve("status", context)).toBe("active");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string keys", () => {
      const strategy = new ColumnStrategy();
      const context: TemplateContext = {
        entity: { "": "empty-key" },
      };

      const result = strategy.resolve("", context);
      expect(result).toBeUndefined();
    });

    it("should handle keys with dots", () => {
      const strategy = new ColumnStrategy();
      const context: TemplateContext = {
        entity: {
          field: {
            with: {
              dots: "value",
            },
          },
        },
      };

      // getValueByPathCase treats dots as nested path separators
      const result = strategy.resolve("field.with.dots", context);
      expect(result).toBe("value");
    });

    it("should handle numeric keys", () => {
      const strategy = new ColumnStrategy();
      const context: TemplateContext = {
        entity: { "123": "numeric-key" },
      };

      const result = strategy.resolve("123", context);
      expect(result).toBe("numeric-key");
    });
  });
});
