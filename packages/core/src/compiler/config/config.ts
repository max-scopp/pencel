import { loadConfig, type ResolvedConfig } from "c12";
import type { PencilConfig } from "../api/index.ts";

/**
 * Default Pencil configuration
 */
export const defaultConfig: Required<PencilConfig> = {
  // input: "src/components/**/*.tsx",
  input: {
    tsconfig: "tsconfig.json",
  },
  output: {
    mode: "aside",
    replace: [/(.+)(\.[^.]+)$/, "$1.gen$2"],
  },
  plugins: [],
  runtime: {
    tagNamespace: "pencel",
  },
};

export class Config {
  result?: ResolvedConfig<Required<PencilConfig>>;

  async load(configFile: string): Promise<void> {
    const result = await loadConfig<Required<PencilConfig>>({
      name: "pencel",
      configFile,
      defaults: defaultConfig,
    });

    this.result = result;
  }

  get config(): Required<PencilConfig> {
    if (!this.result) {
      throw new Error("Config not loaded yet. Call load() first.");
    }

    return this.result.config;
  }

  get cwd(): string {
    if (!this.result) {
      throw new Error("Config not loaded yet. Call load() first.");
    }

    return this.result.cwd ?? process.cwd();
  }
}
