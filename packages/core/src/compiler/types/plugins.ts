import type { PluginOptions } from "dist/index.js";
import type ts from "typescript";
import type { PencelConfig } from "./config-types.js";

export interface PluginRegistry {
  _: PluginOptions;
}

export type PluginNames = keyof Omit<PluginRegistry, "_">;

export type Plugins<TPlugin extends PluginNames = PluginNames> = Array<
  | TPlugin
  | {
      name: TPlugin;
      options?: PluginRegistry[TPlugin];
    }
>;

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
  config: PencelConfig;
}

export const PLUGIN_SKIP: unique symbol = Symbol("__$pencel_plugin_skip$");

export type TransformHandler =
  | {
      aspect: "css:preprocess";
      input: string;
      path: string;
    }
  | {
      aspect: "css:postprocess";
      input: string;
      path: string;
    }
  | {
      aspect: "codegen";
      input: ts.SourceFile;
    };

export type PluginHandler = {
  /**
   * Transform function that processes content
   */
  transform: <THandler extends TransformHandler>(
    handle: THandler,
  ) => Promise<THandler["input"] | typeof PLUGIN_SKIP>;
};

/**
 * Plugin function type - a simple function that receives user options and context
 */
export type PluginFunction<TPlugin extends PluginNames> = (
  options: PluginRegistry[TPlugin],
  context: PluginContext,
) => Promise<PluginHandler | null>;
