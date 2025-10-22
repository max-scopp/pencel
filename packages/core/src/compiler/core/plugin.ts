import { throwError } from "@pencel/utils";
import {
  PLUGIN_SKIP,
  type PluginFunction,
  type PluginHandler,
  type PluginNames,
  type PluginRegistry,
  type TransformHandler,
} from "../types/plugins.ts";
import { perf } from "../utils/perf.ts";
import { CompilerContext } from "./compiler-context.ts";
import { inject } from "./container.ts";

export class Plugins {
  readonly #context = inject(CompilerContext);

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
      const userEntry = this.#context.config.plugins?.find((p) => {
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
          this.#context,
        );

        if (plugin) {
          this.plugins.set(name, plugin);
        }
      }
    }

    perf.end("initialize-plugins");
  }

  // TODO: Not implemented
  async cleanup(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin?.cleanup) {
        await plugin.cleanup();
      }
    }
  }

  async write(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin?.write) {
        await plugin.write();
      }
    }
  }

  async handle<THandle extends TransformHandler>(
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
