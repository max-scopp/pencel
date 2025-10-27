import { relative } from "node:path";
import { createLog, throwError } from "@pencel/utils";
import { loadConfig, type ResolvedConfig } from "c12";
import type { PencelConfig } from "./types/config-types.ts";
import type { BasePluginOptions, PluginNames } from "./types/plugins.ts";

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
  plugins: ["css", "typings", "ir"],
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
    return this.#result?.config ?? throwError("Config not loaded yet.");
  }

  get cwd(): string {
    return (
      (this.#result ?? throwError("Config not loaded yet.")).cwd ??
      process.cwd()
    );
  }

  getUserOptionsForPlugin<TPluginOptions extends BasePluginOptions>(
    pluginName: PluginNames,
  ): TPluginOptions {
    const plugins = this.user.plugins;

    for (const plugin of plugins) {
      if (typeof plugin === "string" && plugin === pluginName) {
        return {
          enabled: true,
        } as TPluginOptions;
      } else if (typeof plugin === "object" && plugin.name === pluginName) {
        return (
          plugin.options ??
          ({
            enabled: true,
          } as TPluginOptions)
        );
      }
    }

    return {
      enabled: false,
    } as TPluginOptions;
  }
}
