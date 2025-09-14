import type { PencilConfig } from "@pencel/core";

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
export const defaultConfig: Required<PencilConfig> = {
  input: {
    tsconfig: "tsconfig.json",
  },
  output: {
    mode: "aside",
    replace: /(.+)(\.[^.]+)$/,
  },
  runtime: {
    tagNamespace: "pencel",
  },
};
