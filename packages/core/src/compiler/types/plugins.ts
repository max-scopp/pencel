/**
 * Plugin configuration options - completely arbitrary and up to the plugin author
 * Other npm packages can extend this via module augmentation
 *
 * Example module augmentation:
 * declare module '@pencil/core/compiler/types/plugins' {
 *   interface PluginOptions {
 *     'my-custom-plugin': {
 *       customOption?: boolean;
 *       value?: number;
 *     };
 *   }
 * }
 */
export interface PluginOptions {
  // Plugins can extend this interface via module augmentation
  [pluginName: string]: unknown;
}

/**
 * Valid plugin names (inferred from registered plugins and extensible via module augmentation)
 */
export type PluginName = keyof PluginOptions;

/**
 * Type-safe plugin name constraint that only allows registered plugin names
 * Falls back to string if no plugins are registered
 */
export type RegisteredPluginName = keyof PluginOptions;

/**
 * Plugin configuration - can be either:
 * 1. Just the plugin name as a string (type-safe to registered plugins)
 * 2. An object with name and options
 */
export type PluginConfig<
  T extends RegisteredPluginName = RegisteredPluginName,
> =
  | T
  | {
      name: T;
      options?: PluginOptions[T];
    };

/**
 * List of plugins configuration with type safety
 */
export type PluginsList = PluginConfig[];

/**
 * Context passed to plugin execution
 */
export interface PluginContext {
  /**
   * Current working directory
   */
  cwd: string;

  /**
   * The complete Pencil configuration
   */
  config: import("./config-types.js").PencelConfig;
}

/**
 * Plugin function type - a simple function that receives user options and context
 */
export type PluginFunction<T = unknown> = (
  options: T,
  context: PluginContext,
) => void | Promise<void>;

/**
 * Helper type to check if a string is a valid registered plugin name
 */
export type IsValidPluginName<T extends string> = T extends RegisteredPluginName
  ? true
  : false;

/**
 * Utility function to validate if a plugin name is registered
 * This provides runtime validation that matches the TypeScript types
 */
export function isValidPluginName(
  name: string,
): name is Extract<keyof PluginOptions, string> {
  // This can be enhanced to check against the actual plugin registry
  // For now, we rely on module augmentation for type safety
  return true;
}

/**
 * Runtime validation helper that checks against the actual plugin registry
 * Import and use the validatePluginNames function from plugin.ts for runtime checks
 */
export type { validatePluginNames } from "../core/plugin.js";

/**
 * Helper function to create a type-safe plugin configuration
 */
export function createPluginConfig<T extends PluginName>(
  name: T,
  options?: T extends keyof PluginOptions ? PluginOptions[T] : unknown,
): PluginConfig<T> {
  if (options !== undefined) {
    return { name, options };
  }
  return name as PluginConfig<T>;
}

/**
 * Helper to validate plugin configurations at runtime
 */
export function validatePluginConfigs(configs: PluginsList): {
  valid: PluginConfig[];
  invalid: { config: unknown; reason: string }[];
} {
  const valid: PluginConfig[] = [];
  const invalid: { config: unknown; reason: string }[] = [];

  for (const config of configs) {
    if (typeof config === "string") {
      if (isValidPluginName(config)) {
        valid.push(config);
      } else {
        invalid.push({
          config,
          reason: `Plugin '${config}' is not registered`,
        });
      }
    } else if (
      typeof config === "object" &&
      config !== null &&
      "name" in config &&
      typeof config.name === "string"
    ) {
      if (isValidPluginName(config.name)) {
        valid.push(config);
      } else {
        invalid.push({
          config,
          reason: `Plugin '${config.name}' is not registered`,
        });
      }
    } else {
      invalid.push({ config, reason: "Invalid plugin configuration format" });
    }
  }

  return { valid, invalid };
}
