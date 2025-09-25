import type { CustomAtRules, TransformOptions } from "lightningcss";
import type * as sass from "sass-embedded";
import type ts from "typescript";
import type { PencelConfig } from "./config-types.ts";

export interface PluginRegistry {
  _: object;
  css: {
    enabled?: boolean;
    lightningCssOptions?: Omit<
      TransformOptions<CustomAtRules>,
      "code" | "filename"
    >;
  };
  scss: {
    enabled?: boolean;
    scssOptions?: sass.StringOptions<"async">;
  };

  angular: {
    enabled: boolean;
    /**
     * Relative to the config file, where to output angular code to make
     * the web components available as Angular components.
     */
    proxyFile: string;
  };
}

export type PluginNames = keyof Omit<PluginRegistry, "_">;

export type PluginDefs<TPlugin extends PluginNames = PluginNames> = Array<
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
      // Plugins changing user styles to standard CSS
      aspect: "css:preprocess";
      input: string;
      path: string;
    }
  | {
      // Plugins changing standard CSS to optimized CSS
      aspect: "css:postprocess";
      input: string;
      path: string;
    }
  | {
      // Plugins generating further code, e.g. outputting Angular, React, etc. component code
      // You are allowed to modify the input TypeScript AST here; You receive the just-about to-be-emitted AST
      // and can modify it as you like.
      aspect: "codegen";
      input: ts.SourceFile;
    };

export type PluginHandler = {
  /**
   * Work done when all files have been processed and the compiler is about to quit.
   * TODO: Not implemented
   */
  cleanup?: () => Promise<void>;

  /**
   * Right after the core transformed files have been written, this function is called
   * to allow plugins to write additional files, e.g. an Angular module file.
   */
  write?: () => Promise<void>;

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
