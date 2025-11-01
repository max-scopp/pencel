import { relative } from "node:path";
import { createLog, throwError } from "@pencel/utils";
import { loadConfig, type ResolvedConfig } from "c12";
import type { PencelConfig } from "./types/config-types.ts";
import type { PluginNames, PluginOptionsOf } from "./types/plugins.ts";

const log = createLog("Config");

/**
 * Default Pencil configuration
 */
export const defaultConfig: Required<PencelConfig> = {
  baseDir: "src",
  input: {
    qualifier: "pen",
  },
  output: {
    qualifier: "gen",
  },
  tsconfig: "tsconfig.json",
  plugins: ["css", "typings", "ir", "components"],
  runtime: {
    tagNamespace: "pencel",
  },
};

/**
 * Type guard: Check if a plugin definition is a plugin object with a matching name.
 */
function isPluginWithName<TPluginName extends PluginNames>(
  plugin: unknown,
  name: TPluginName,
): plugin is { name: TPluginName; options?: PluginOptionsOf<TPluginName> } {
  return (
    typeof plugin === "object" &&
    plugin !== null &&
    "name" in plugin &&
    plugin.name === name
  );
}

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

  getUserOptionsForPlugin<TPluginName extends PluginNames>(
    pluginName: TPluginName,
  ): PluginOptionsOf<TPluginName> {
    const plugins = this.user.plugins;

    for (const plugin of plugins) {
      if (typeof plugin === "string" && plugin === pluginName) {
        return { enabled: true } as PluginOptionsOf<TPluginName>;
      }

      if (isPluginWithName(plugin, pluginName)) {
        return (
          plugin.options ?? ({ enabled: true } as PluginOptionsOf<TPluginName>)
        );
      }
    }

    return { enabled: false } as PluginOptionsOf<TPluginName>;
  }
}
