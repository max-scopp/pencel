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
 * Valid plugin names (extensible via module augmentation)
 */
export type PluginName = keyof PluginOptions | string;

/**
 * Plugin configuration - can be either:
 * 1. Just the plugin name as a string
 * 2. An object with name and options
 */
export type PluginConfig<T extends string = string> =
  | T
  | {
      name: T;
      options?: T extends keyof PluginOptions ? PluginOptions[T] : unknown;
    };

/**
 * List of plugins configuration
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
