import type { PencilConfig } from "@pencil/core";

/**
 * Define a Pencil configuration with type safety
 * @param config - The configuration object
 * @returns The configuration object with proper typing
 */
export function defineConfig(config: PencilConfig): PencilConfig {
  return config;
}

/**
 * Default Pencil configuration
 */
export const defaultConfig: PencilConfig = {
  compiler: {
    target: "es2022",
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  },
  output: {
    dir: "dist",
    format: "esm",
  },
  tagNamespace: "",
};
