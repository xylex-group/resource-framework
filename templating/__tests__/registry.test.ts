import { describe, it, expect, beforeEach } from "vitest";
import {
  registerStrategy,
  getStrategy,
  hasStrategy,
  getRegisteredPrefixes,
  clearRegistry,
  unregisterStrategy,
} from "../registry";
import { initializeTemplating } from "../index";
import type { TemplateStrategy, TemplateContext } from "../types";

describe("Strategy Registry", () => {
  beforeEach(() => {
    clearRegistry();
  });

  describe("Registration", () => {
    it("should register a new strategy", () => {
      class TestStrategy implements TemplateStrategy {
        resolve(): unknown {
          return "test";
        }
      }

      registerStrategy("test", new TestStrategy());

      expect(hasStrategy("test")).toBe(true);
      expect(getStrategy("test")).toBeInstanceOf(TestStrategy);
    });

    it("should be case-insensitive for prefix names", () => {
      class TestStrategy implements TemplateStrategy {
        resolve(): unknown {
          return "test";
        }
      }

      registerStrategy("TEST", new TestStrategy());

      expect(hasStrategy("test")).toBe(true);
      expect(hasStrategy("TEST")).toBe(true);
      expect(getStrategy("test")).toBeDefined();
    });

    it("should overwrite existing strategy", () => {
      class Strategy1 implements TemplateStrategy {
        resolve(): unknown {
          return "one";
        }
      }
      class Strategy2 implements TemplateStrategy {
        resolve(): unknown {
          return "two";
        }
      }

      registerStrategy("test", new Strategy1());
      const first = getStrategy("test");

      registerStrategy("test", new Strategy2());
      const second = getStrategy("test");

      expect(first).toBeInstanceOf(Strategy1);
      expect(second).toBeInstanceOf(Strategy2);
      expect(first).not.toBe(second);
    });
  });

  describe("Retrieval", () => {
    it("should return undefined for unregistered strategy", () => {
      const strategy = getStrategy("nonexistent");
      expect(strategy).toBeUndefined();
    });

    it("should return false for unregistered prefix", () => {
      expect(hasStrategy("nonexistent")).toBe(false);
    });

    it("should list all registered prefixes", () => {
      initializeTemplating();

      const prefixes = getRegisteredPrefixes();
      expect(prefixes).toContain("env");
      expect(prefixes).toContain("user");
      expect(prefixes).toContain("resource");
      expect(prefixes).toContain("resource_id");
    });
  });

  describe("Unregistration", () => {
    it("should unregister a strategy", () => {
      class TestStrategy implements TemplateStrategy {
        resolve(): unknown {
          return "test";
        }
      }

      registerStrategy("test", new TestStrategy());
      expect(hasStrategy("test")).toBe(true);

      const removed = unregisterStrategy("test");
      expect(removed).toBe(true);
      expect(hasStrategy("test")).toBe(false);
    });

    it("should return false when unregistering non-existent strategy", () => {
      const removed = unregisterStrategy("nonexistent");
      expect(removed).toBe(false);
    });

    it("should be case-insensitive for unregistration", () => {
      class TestStrategy implements TemplateStrategy {
        resolve(): unknown {
          return "test";
        }
      }

      registerStrategy("TEST", new TestStrategy());
      const removed = unregisterStrategy("test");

      expect(removed).toBe(true);
      expect(hasStrategy("TEST")).toBe(false);
    });
  });

  describe("Clear Registry", () => {
    it("should clear all strategies", () => {
      initializeTemplating();

      expect(hasStrategy("env")).toBe(true);
      expect(hasStrategy("user")).toBe(true);

      clearRegistry();

      expect(hasStrategy("env")).toBe(false);
      expect(hasStrategy("user")).toBe(false);
      expect(getRegisteredPrefixes()).toHaveLength(0);
    });

    it("should allow re-initialization after clear", () => {
      initializeTemplating();
      clearRegistry();
      initializeTemplating();

      expect(hasStrategy("env")).toBe(true);
      expect(hasStrategy("user")).toBe(true);
    });
  });

  describe("Initialization", () => {
    it("should register default strategies on init", () => {
      initializeTemplating();

      const prefixes = getRegisteredPrefixes();
      expect(prefixes).toContain("env");
      expect(prefixes).toContain("user");
      expect(prefixes).toContain("resource");
      expect(prefixes).toContain("resource_id");
    });

    it("should be idempotent", () => {
      initializeTemplating();
      const prefixes1 = getRegisteredPrefixes();

      initializeTemplating();
      const prefixes2 = getRegisteredPrefixes();

      expect(prefixes1).toEqual(prefixes2);
    });
  });

  describe("Strategy Execution", () => {
    it("should execute registered strategy", () => {
      class MockStrategy implements TemplateStrategy {
        resolve(key: string, _context: TemplateContext): unknown {
          return `mock-${key}`;
        }
      }

      registerStrategy("mock", new MockStrategy());

      const strategy = getStrategy("mock");
      const result = strategy?.resolve("test", {});

      expect(result).toBe("mock-test");
    });

    it("should pass context to strategy", () => {
      let receivedContext: TemplateContext | undefined;

      class ContextCapturingStrategy implements TemplateStrategy {
        resolve(key: string, context: TemplateContext): unknown {
          receivedContext = context;
          return context.user?.name;
        }
      }

      registerStrategy("capture", new ContextCapturingStrategy());

      const strategy = getStrategy("capture");
      const context: TemplateContext = {
        user: { name: "John" },
      };

      strategy?.resolve("name", context);

      expect(receivedContext).toBeDefined();
      expect(receivedContext?.user?.name).toBe("John");
    });
  });

  describe("Multiple Registrations", () => {
    it("should handle many strategies", () => {
      for (let i = 0; i < 100; i++) {
        class DynamicStrategy implements TemplateStrategy {
          resolve(): unknown {
            return `value-${i}`;
          }
        }
        registerStrategy(`strategy${i}`, new DynamicStrategy());
      }

      const prefixes = getRegisteredPrefixes();
      expect(prefixes.length).toBeGreaterThanOrEqual(100);

      expect(hasStrategy("strategy0")).toBe(true);
      expect(hasStrategy("strategy50")).toBe(true);
      expect(hasStrategy("strategy99")).toBe(true);
    });
  });
});
