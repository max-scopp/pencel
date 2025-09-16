import type { PluginFunction, PluginName } from "../types/plugins.js";

/**
 * Registry to store all registered plugins
 */
const pluginRegistry = new Map<
  string,
  {
    options: unknown;
    pluginFn: PluginFunction<unknown>;
  }
>();

/**
 * Register a plugin function with the given name and options
 * The name should match a plugin defined in the PluginOptions interface
 *
 * @param name - The unique name of the plugin (should be type-safe via module augmentation)
 * @param options - The options to pass to the plugin function
 * @param pluginFn - The plugin function to execute
 */
export function registerPlugin<T = unknown>(
  name: Extract<PluginName, string>,
  options: T,
  pluginFn: PluginFunction<T>,
): void {
  if (pluginRegistry.has(name)) {
    throw new Error(`Plugin '${name}' is already registered`);
  }

  pluginRegistry.set(name, {
    options,
    pluginFn: pluginFn as PluginFunction<unknown>,
  });
}

/**
 * Get a registered plugin by name
 *
 * @param name - The name of the plugin to retrieve
 * @returns The plugin entry or undefined if not found
 */
export function getPlugin(
  name: string,
): { options: unknown; pluginFn: PluginFunction<unknown> } | undefined {
  return pluginRegistry.get(name);
}

/**
 * Check if a plugin is registered
 *
 * @param name - The name of the plugin to check
 * @returns True if the plugin is registered, false otherwise
 */
export function hasPlugin(name: string): boolean {
  return pluginRegistry.has(name);
}

/**
 * Get all registered plugin names
 *
 * @returns Array of all registered plugin names
 */
export function getRegisteredPluginNames(): string[] {
  return Array.from(pluginRegistry.keys());
}

/**
 * Validate that all provided plugin names are actually registered
 * This provides runtime validation for plugin configurations
 *
 * @param names - Array of plugin names to validate
 * @returns Object with valid and invalid plugin names
 */
export function validatePluginNames(names: string[]): {
  valid: string[];
  invalid: string[];
} {
  const registeredNames = getRegisteredPluginNames();
  const valid = names.filter((name) => registeredNames.includes(name));
  const invalid = names.filter((name) => !registeredNames.includes(name));
  return { valid, invalid };
}
