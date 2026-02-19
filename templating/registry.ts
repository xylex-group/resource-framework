import type { TemplateStrategy } from "./types";

/**
 * Global registry of template strategies.
 * Maps prefix names to their corresponding strategy implementations.
 */
const strategyRegistry = new Map<string, TemplateStrategy>();

/**
 * Register a template strategy for a given prefix.
 * 
 * @param prefix - The prefix to register (e.g., 'env', 'user', 'resource')
 * @param strategy - The strategy implementation
 * 
 * @example
 * registerStrategy('env', new EnvStrategy());
 * registerStrategy('user', new UserStrategy());
 */
export function registerStrategy(prefix: string, strategy: TemplateStrategy): void {
  strategyRegistry.set(prefix.toLowerCase(), strategy);
}

/**
 * Get a registered strategy by prefix.
 * 
 * @param prefix - The prefix to look up
 * @returns The strategy if found, undefined otherwise
 */
export function getStrategy(prefix: string): TemplateStrategy | undefined {
  return strategyRegistry.get(prefix.toLowerCase());
}

/**
 * Check if a strategy is registered for a given prefix.
 * 
 * @param prefix - The prefix to check
 * @returns True if a strategy exists for this prefix
 */
export function hasStrategy(prefix: string): boolean {
  return strategyRegistry.has(prefix.toLowerCase());
}

/**
 * Get all registered strategy prefixes.
 * 
 * @returns Array of registered prefix names
 */
export function getRegisteredPrefixes(): string[] {
  return Array.from(strategyRegistry.keys());
}

/**
 * Clear all registered strategies (mainly for testing).
 */
export function clearRegistry(): void {
  strategyRegistry.clear();
}

/**
 * Unregister a strategy by prefix.
 * 
 * @param prefix - The prefix to unregister
 * @returns True if the strategy was removed, false if it didn't exist
 */
export function unregisterStrategy(prefix: string): boolean {
  return strategyRegistry.delete(prefix.toLowerCase());
}
