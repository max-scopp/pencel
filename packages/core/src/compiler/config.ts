import { relative } from "node:path";
import { createLog, throwError } from "@pencel/utils";
import { loadConfig, type ResolvedConfig } from "c12";
import type { PencelConfig } from "./types/config-types.ts";

const log = createLog("Config");

/**
 * Default Pencil configuration
 */
export const defaultConfig: Required<PencelConfig> = {
  input: {
    qualifier: "pen",
  },
  output: {
    qualifier: "gen",
  },
  tsconfig: "tsconfig.json",
  plugins: [],
  runtime: {
    tagNamespace: "pencel",
  },
};

export class Config {
  #result?: ResolvedConfig<Required<PencelConfig>>;

  async load(configFile: string = "pencel.config"): Promise<void> {
    const result = await loadConfig<Required<PencelConfig>>({
      name: "pencel",
      configFile,
      defaults: defaultConfig,
    });

    log(
      `Using ${relative(result.cwd ?? process.cwd(), result.configFile ?? "")}`,
    );

    this.#result = result;
  }

  get user(): Required<PencelConfig> {
    if (!this.#result) {
      throw new Error("");
    }

    return this.#result.config ?? throwError("Config not loaded yet.");
  }

  get cwd(): string {
    return (
      (this.#result ?? throwError("Config not loaded yet.")).cwd ??
      process.cwd()
    );
  }
}
