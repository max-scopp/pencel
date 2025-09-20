import {
  PLUGIN_SKIP,
  type PluginFunction,
  type PluginHandler,
  type PluginNames,
  type PluginRegistry,
  type TransformHandler,
} from "@pencel/core";
import { throwError } from "@pencel/utils";
import type { PencelContext } from "../types/compiler-types.ts";
import { perf } from "../utils/perf.ts";

export class Plugins {
  static pluginsToInitialize: Map<
    string,
    { pluginFn: PluginFunction<PluginNames>; defaults: object }
  > = new Map();

  plugins: Map<string, PluginHandler> = new Map<string, PluginHandler>();

  static register<TPlugin extends PluginNames>(
    name: TPlugin,
    defaults: PluginRegistry[TPlugin],
    pluginFn: PluginFunction<TPlugin>,
  ): void {
    if (Plugins.pluginsToInitialize.has(name)) {
      throwError(`Plugin '${name}' is already registered`);
    }

    Plugins.pluginsToInitialize.set(name, {
      pluginFn: pluginFn as PluginFunction<PluginNames>,
      defaults,
    });
  }

  async initialize(context: PencelContext): Promise<void> {
    perf.start("initialize-plugins");

    for (const [
      name,
      { pluginFn, defaults },
    ] of Plugins.pluginsToInitialize.entries()) {
      const userEntry = context.config.plugins?.find((p) => {
        return typeof p === "string" ? p === name : p.name === name;
      });

      const userOptions =
        typeof userEntry === "string" ? {} : (userEntry?.options ?? {});

      if (userOptions) {
        const plugin = await pluginFn(
          {
            ...defaults,
            ...userOptions,
          },
          context,
        );

        if (plugin) {
          this.plugins.set(name, plugin);
        }
      }
    }

    perf.end("initialize-plugins");
  }

  async handlePlugins<THandle extends TransformHandler>(
    handle: THandle,
  ): Promise<THandle["input"]> {
    let intermediate = handle.input;

    for (const plugin of this.plugins.values()) {
      if (plugin) {
        const r = await plugin.transform(handle);

        if (r === PLUGIN_SKIP) {
          continue;
        }

        intermediate = r;
      }
    }

    return intermediate;
  }
}
