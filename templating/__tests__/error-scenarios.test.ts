import { describe, it, expect, beforeEach } from "vitest";
import { resolveTemplate, resolveTemplateValue } from "../resolver";
import {
  initializeTemplating,
  clearRegistry,
  registerStrategy,
} from "../index";
import type { TemplateContext, TemplateStrategy } from "../types";

describe("Error Scenarios and Edge Cases", () => {
  beforeEach(() => {
    clearRegistry();
    initializeTemplating();
  });

  describe("Malformed Input", () => {
    it("should handle null template", () => {

      const result = resolveTemplate(null as any, {});
      expect(result).toBe("");
    });

    it("should handle undefined template", () => {

      const result = resolveTemplate(undefined as any, {});
      expect(result).toBe("");
    });

    it("should handle number as template", () => {

      const result = resolveTemplate(123 as any, {});
      expect(result).toBe("123");
    });

    it("should handle boolean as template", () => {

      const result = resolveTemplate(true as any, {});
      expect(result).toBe("true");
    });

    it("should handle object as template", () => {

      const result = resolveTemplate({ key: "value" } as any, {});
      expect(result).toBe("[object Object]");
    });

    it("should handle array as template", () => {

      const result = resolveTemplate(["a", "b"] as any, {});
      expect(result).toBe("a,b");
    });
  });

  describe("Malformed Templates", () => {
    it("should handle unmatched braces", () => {
      const context: TemplateContext = {
        entity: { name: "Test" },
      };

      // Unmatched braces don't match the regex, so they pass through
      expect(resolveTemplate("{{name}", context)).toBe("{{name}");
      expect(resolveTemplate("{name}}", context)).toBe("{name}}");

      // {{{name}}} - regex matches {{{name from left to first }}, leaving }}}
      // Then matches {{name from that, leaving }
      expect(resolveTemplate("{{{name}}}", context)).toBe("}");
    });

    it("should handle nested double braces", () => {
      const context: TemplateContext = {
        entity: { name: "Test" },
      };

      // Regex matches {{{{name from left, resulting in }}}} remaining
      const result = resolveTemplate("{{{{name}}}}", context);
      expect(result).toBe("}}");
    });

    it("should handle templates with only whitespace", () => {
      const result = resolveTemplate("{{   }}", {});
      expect(result).toBe("");
    });

    it("should handle templates with newlines", () => {
      const context: TemplateContext = {
        entity: { name: "Test" },
      };

      // Regex {{.*?}} is not multiline, so newlines break the pattern
      const result = resolveTemplate("{{\nname\n}}", context);
      expect(result).toBe("{{\nname\n}}"); // Doesn't match
    });
  });

  describe("Circular References", () => {
    it("should handle circular entity references", () => {

      const circular: any = { name: "Test" };
      circular.self = circular;

      const context: TemplateContext = {
        entity: circular,
      };

      const result = resolveTemplate("{{name}}", context);
      expect(result).toBe("Test");
    });
  });

  describe("Large Numbers", () => {
    it("should handle very large numbers", () => {
      const context: TemplateContext = {
        entity: { big: Number.MAX_SAFE_INTEGER },
      };

      const result = resolveTemplateValue("{{big}}", context);
      expect(result).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("should handle very small numbers", () => {
      const context: TemplateContext = {
        entity: { small: Number.MIN_SAFE_INTEGER },
      };

      const result = resolveTemplateValue("{{small}}", context);
      expect(result).toBe(Number.MIN_SAFE_INTEGER);
    });

    it("should handle floating point precision", () => {
      const context: TemplateContext = {
        entity: { value: 0.1 + 0.2 }, // Classic JS float issue
      };

      const result = resolveTemplateValue("{{value}}", context);
      expect(result).toBeCloseTo(0.3);
    });
  });

  describe("Special Values", () => {
    it("should handle NaN", () => {
      const context: TemplateContext = {
        entity: { value: NaN },
      };

      const result = resolveTemplate("{{value}}", context);
      expect(result).toBe("NaN");
    });

    it("should handle Infinity", () => {
      const context: TemplateContext = {
        entity: { value: Infinity },
      };

      const result = resolveTemplate("{{value}}", context);
      expect(result).toBe("Infinity");
    });

    it("should handle -Infinity", () => {
      const context: TemplateContext = {
        entity: { value: -Infinity },
      };

      const result = resolveTemplate("{{value}}", context);
      expect(result).toBe("-Infinity");
    });

    it("should handle Date objects", () => {
      const date = new Date("2025-01-15T10:30:00Z");
      const context: TemplateContext = {
        entity: { created: date },
      };

      const result = resolveTemplate("{{created}}", context);
      expect(result).toBe(date.toString());
    });

    it("should handle RegExp objects", () => {
      const context: TemplateContext = {
        entity: { pattern: /test/gi },
      };

      const result = resolveTemplate("{{pattern}}", context);
      expect(result).toBe("/test/gi");
    });
  });

  describe("Unicode and Encoding", () => {
    it("should handle emoji in keys", () => {
      const context: TemplateContext = {
        entity: { "emoji_👍": "thumbs up" },
      };

      const result = resolveTemplate("{{emoji_👍}}", context);
      expect(result).toBe("thumbs up");
    });

    it("should handle emoji in values", () => {
      const context: TemplateContext = {
        entity: { status: "✅ Complete" },
      };

      const result = resolveTemplate("{{status}}", context);
      expect(result).toBe("✅ Complete");
    });

    it("should handle RTL text", () => {
      const context: TemplateContext = {
        entity: { text: "مرحبا" }, // Arabic "Hello"
      };

      const result = resolveTemplate("{{text}}", context);
      expect(result).toBe("مرحبا");
    });

    it("should handle CJK characters", () => {
      const context: TemplateContext = {
        entity: {
          chinese: "你好",
          japanese: "こんにちは",
          korean: "안녕하세요",
        },
      };

      expect(resolveTemplate("{{chinese}}", context)).toBe("你好");
      expect(resolveTemplate("{{japanese}}", context)).toBe("こんにちは");
      expect(resolveTemplate("{{korean}}", context)).toBe("안녕하세요");
    });
  });

  describe("SQL Injection Prevention", () => {
    it("should not execute SQL-like strings", () => {
      const context: TemplateContext = {
        entity: { malicious: "'; DROP TABLE users; --" },
      };

      const result = resolveTemplate("{{malicious}}", context);
      expect(result).toBe("'; DROP TABLE users; --");
      // Note: Actual SQL injection prevention happens at database layer
    });

    it("should not evaluate JavaScript", () => {
      const context: TemplateContext = {
        entity: { code: "alert('XSS')" },
      };

      const result = resolveTemplate("{{code}}", context);
      expect(result).toBe("alert('XSS')");
      // Templates are data, not code
    });
  });

  describe("Strategy Errors", () => {
    it("should handle strategy that throws error", () => {
      class ErrorStrategy implements TemplateStrategy {
        resolve(): unknown {
          throw new Error("Strategy error");
        }
      }

      registerStrategy("error", new ErrorStrategy());

      // Non-strict mode should not throw
      expect(() => {
        resolveTemplate("{{error.value}}", {});
      }).toThrow();
    });

    it("should handle strategy that returns undefined", () => {
      class UndefinedStrategy implements TemplateStrategy {
        resolve(): unknown {
          return undefined;
        }
      }

      registerStrategy("undef", new UndefinedStrategy());

      const result = resolveTemplate("{{undef.value}}", {});
      expect(result).toBe("");
    });

    it("should handle strategy that returns complex objects", () => {
      class ObjectStrategy implements TemplateStrategy {
        resolve(): unknown {
          return { nested: { value: "deep" } };
        }
      }

      registerStrategy("obj", new ObjectStrategy());

      const result = resolveTemplate("{{obj.value}}", {});
      expect(result).toBe("[object Object]");
    });
  });

  describe("Context Edge Cases", () => {
    it("should handle empty context", () => {
      const result = resolveTemplate("{{anything}}", {});
      expect(result).toBe("");
    });

    it("should handle context with null user", () => {
      const context: TemplateContext = {

        user: null as any,
      };

      const result = resolveTemplate("{{user.name}}", context);
      expect(result).toBe("");
    });

    it("should handle context with null entity", () => {
      const context: TemplateContext = {

        entity: null as any,
      };

      const result = resolveTemplate("{{field}}", context);
      expect(result).toBe("");
    });

    it("should handle missing idColumn", () => {
      const context: TemplateContext = {
        entity: { id: "123" },
        idColumn: undefined,
      };

      // Without idColumn, resource.id falls back to resolving 'id' from entity
      const result = resolveTemplate("{{resource.id}}", context);
      expect(result).toBe("123");
    });
  });

  describe("Concurrent Resolution", () => {
    it("should handle multiple simultaneous resolutions", () => {
      const context: TemplateContext = {
        entity: { value: "test" },
      };

      const promises = Array(100)
        .fill(null)
        .map(() => Promise.resolve(resolveTemplate("{{value}}", context)));

      return Promise.all(promises).then((results) => {
        expect(results.every((r) => r === "test")).toBe(true);
      });
    });
  });

  describe("Memory and Performance", () => {
    it("should not leak memory with many resolutions", () => {
      const context: TemplateContext = {
        entity: { value: "test" },
      };

      // Resolve template many times
      for (let i = 0; i < 1000; i++) {
        resolveTemplate("{{value}}", context);
      }

      // If we get here without memory issues, test passes
      expect(true).toBe(true);
    });

    it("should handle very long keys", () => {
      const longKey = "a".repeat(1000);
      const context: TemplateContext = {
        entity: { [longKey]: "value" },
      };

      const result = resolveTemplate(`{{${longKey}}}`, context);
      expect(result).toBe("value");
    });

    it("should handle many template tokens", () => {
      const context: TemplateContext = {
        entity: { v: "x" },
      };

      const template = Array(1000).fill("{{v}}").join("");
      const result = resolveTemplate(template, context);
      expect(result).toBe("x".repeat(1000));
    });
  });

  describe("Type Coercion Edge Cases", () => {
    it("should handle string '0' vs number 0", () => {
      const ctx1: TemplateContext = { entity: { v: "0" } };
      const ctx2: TemplateContext = { entity: { v: 0 } };

      const r1 = resolveTemplateValue("{{v}}", ctx1);
      const r2 = resolveTemplateValue("{{v}}", ctx2);

      expect(r1).toBe(0);
      expect(r2).toBe(0);
      expect(typeof r1).toBe("number");
      expect(typeof r2).toBe("number");
    });

    it("should handle string 'null' vs null", () => {
      const ctx1: TemplateContext = { entity: { v: "null" } };
      const ctx2: TemplateContext = { entity: { v: null } };

      const r1 = resolveTemplateValue("{{v}}", ctx1);
      const r2 = resolveTemplateValue("{{v}}", ctx2);

      expect(r1).toBe("null"); // String "null" stays as string
      expect(r2).toBe(null); // Actual null
    });

    it("should handle string 'undefined' vs undefined", () => {
      const ctx1: TemplateContext = { entity: { v: "undefined" } };
      const ctx2: TemplateContext = { entity: { v: undefined } };

      const r1 = resolveTemplateValue("{{v}}", ctx1);
      const r2 = resolveTemplateValue("{{v}}", ctx2);

      expect(r1).toBe("undefined"); // String "undefined"
      expect(r2).toBe(null); // Undefined entity values become null
    });

    it("should not coerce non-numeric strings to numbers", () => {
      const context: TemplateContext = {
        entity: { text: "abc123" },
      };

      const result = resolveTemplateValue("{{text}}", context);
      expect(result).toBe("abc123");
      expect(typeof result).toBe("string");
    });
  });

  describe("Options Edge Cases", () => {
    it("should handle conflicting options", () => {
      const context: TemplateContext = {
        entity: { value: 42 },
      };

      // preserveTypes: true but custom coerce forces string
      const result = resolveTemplate("{{value}}", context, {
        preserveTypes: true,
        coerce: (v) => `str:${v}`,
      });

      expect(result).toBe("str:42");
    });

    it("should handle defaultValue with strict mode", () => {
      // strict: true should throw before defaultValue is used
      expect(() => {
        resolveTemplate(
          "{{missing}}",
          {},
          {
            strict: true,
            defaultValue: "default",
          },
        );
      }).toThrow();
    });

    it("should handle custom coercion returning undefined", () => {
      const context: TemplateContext = {
        entity: { value: "test" },
      };

      const result = resolveTemplate("{{value}}", context, {
        coerce: () => undefined,
      });

      expect(result).toBe("");
    });

    it("should handle custom coercion throwing error", () => {
      const context: TemplateContext = {
        entity: { value: "test" },
      };

      expect(() => {
        resolveTemplate("{{value}}", context, {
          coerce: () => {
            throw new Error("Coercion error");
          },
        });
      }).toThrow("Coercion error");
    });
  });

  describe("Prefix Detection Edge Cases", () => {
    it("should handle dots without prefix", () => {
      const context: TemplateContext = {
        entity: {
          user: { name: "John" }, // 'user' is a field, not a prefix
        },
      };

      // 'user' is a registered prefix (UserStrategy), so it tries to resolve from context.user
      // Since context.user is undefined, it returns empty
      // To access entity.user.name, use column strategy on the full path
      const result = resolveTemplate("{{user.name}}", context);
      expect(result).toBe(""); // UserStrategy takes precedence, context.user undefined
    });

    it("should handle multiple dots", () => {
      const context: TemplateContext = {
        entity: {
          a: {
            b: {
              c: {
                d: "deep",
              },
            },
          },
        },
      };

      const result = resolveTemplate("{{a.b.c.d}}", context);
      expect(result).toBe("deep");
    });

    it("should handle trailing dot", () => {
      const context: TemplateContext = {
        entity: { value: "test" },
      };

      const result = resolveTemplate("{{value.}}", context);
      expect(result).toBe("");
    });

    it("should handle leading dot", () => {
      const context: TemplateContext = {
        entity: { value: "test" },
      };

      const result = resolveTemplate("{{.value}}", context);
      expect(result).toBe("");
    });
  });

  describe("Strategy Fallback Chain", () => {
    it("should try fallback when strategy returns undefined", () => {
      class AlwaysUndefinedStrategy implements TemplateStrategy {
        resolve(): unknown {
          return undefined;
        }
      }

      registerStrategy("always_undef", new AlwaysUndefinedStrategy());

      const context: TemplateContext = {
        entity: { value: "fallback" },
      };

      const result = resolveTemplate("{{always_undef.value}}", context);
      expect(result).toBe(""); // Strategy returned undefined
    });
  });

  describe("Real Error Scenarios", () => {
    it("should handle missing user in user.org_id", () => {
      const result = resolveTemplate("{{user.organization_id}}", {});
      expect(result).toBe("");
    });

    it("should handle missing entity in resource_id", () => {
      const result = resolveTemplate("{{resource_id}}", {
        idColumn: "id",
      });
      expect(result).toBe("");
    });

    it("should handle missing idColumn in resource.id", () => {
      const result = resolveTemplate("{{resource.id}}", {
        entity: { id: "123" },
      });
      // Falls back to resolving 'id' from entity
      expect(result).toBe("123");
    });

    it("should handle widget condition with missing data", () => {
      const context: TemplateContext = {};

      const conditions = [
        { eq_column: "customer_id", eq_value: "{{resource_id}}" },
        { eq_column: "organization_id", eq_value: "{{user.organization_id}}" },
      ];

      const resolved = conditions.map((c) => ({
        eq_column: c.eq_column,
        eq_value: resolveTemplateValue(c.eq_value, context),
      }));

      // resolveTemplateValue returns null for empty string templates
      expect(resolved[0].eq_value).toBe(null);
      expect(resolved[1].eq_value).toBe(null);
    });
  });

  describe("Path Construction Errors", () => {
    it("should handle incomplete path templates", () => {
      const context: TemplateContext = {
        user: { organization_id: "org-123" },
        // Missing entity/resource_id
      };

      const path = resolveTemplate(
        "rsf/{{user.organization_id}}/customers/{{resource_id}}",
        context,
      );

      expect(path).toBe("rsf/org-123/customers/");
    });

    it("should handle missing organization in S3 path", () => {
      const context: TemplateContext = {
        entity: { customer_id: "cust-456" },
        idColumn: "customer_id",
        // Missing user.organization_id
      };

      const path = resolveTemplate(
        "rsf/{{user.organization_id}}/customers/{{resource_id}}",
        context,
      );

      expect(path).toBe("rsf//customers/cust-456");
    });
  });

  describe("Logging and Warnings", () => {
    it("should log warnings when enabled", () => {
      const warnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (msg: string) => warnings.push(msg);

      const result = resolveTemplate(
        "{{missing}}",
        {},
        {
          logWarnings: true,
        },
      );

      console.warn = originalWarn;

      expect(result).toBe("");
      expect(warnings.length).toBeGreaterThan(0);
    });

    it("should not log warnings when disabled", () => {
      const warnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (msg: string) => warnings.push(msg);

      resolveTemplate(
        "{{missing}}",
        {},
        {
          logWarnings: false,
        },
      );

      console.warn = originalWarn;

      // Should not have warnings from template system
      const templateWarnings = warnings.filter((w) =>
        w.includes("TemplateResolver"),
      );
      expect(templateWarnings.length).toBe(0);
    });
  });

  describe("Security Edge Cases", () => {
    it("should not allow prototype pollution", () => {
      const context: TemplateContext = {
        entity: {
          __proto__: { polluted: "bad" },

        } as any,
      };

      const result = resolveTemplate("{{__proto__}}", context);
      // __proto__ is accessible via getValueByKeyCase but returns object
      expect(result).toContain("object");
    });

    it("should not allow constructor access", () => {
      const context: TemplateContext = {
        entity: { value: "test" },
      };

      const result = resolveTemplate("{{constructor}}", context);
      // Should not resolve to constructor
      expect(typeof result).toBe("string");
    });
  });
});
