import { createLog } from "@pencel/utils";
import { loadConfig, type ResolvedConfig } from "c12";
import type { PencelConfig } from "../types/config-types.ts";

const log = createLog("Config");

/**
 * Default Pencil configuration
 */
export const defaultConfig: Required<PencelConfig> = {
  // input: "src/components/**/*.tsx",
  input: {
    tsconfig: "tsconfig.json",
  },
  srcBase: "src",
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
  result?: ResolvedConfig<Required<PencelConfig>>;

  async load(configFile: string = "pencel.config"): Promise<void> {
    log(`Using config ${configFile}`);

    const result = await loadConfig<Required<PencelConfig>>({
      name: "pencel",
      configFile,
      defaults: defaultConfig,
    });

    this.result = result;
  }

  get config(): Required<PencelConfig> {
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
