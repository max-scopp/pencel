import { throwError } from "@pencel/utils";
import { Compiler } from "sass";
import {
  PLUGIN_SKIP,
  type PluginFunction,
  type PluginHandler,
  type PluginNames,
  type PluginRegistry,
  type TransformHandler,
} from "../types/plugins.ts";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";

export class Plugins {
  readonly #compiler = inject(Compiler);

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

  async initialize(): Promise<void> {
    perf.start("initialize-plugins");

    for (const [
      name,
      { pluginFn, defaults },
    ] of Plugins.pluginsToInitialize.entries()) {
      const userEntry = this.#compiler.context.config.plugins?.find((p) => {
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
          this.#compiler.context,
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
