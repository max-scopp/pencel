import { throwError } from "@pencel/utils";
import type { PencelContext } from "../types/compiler-types.ts";
import type { PencelConfig } from "../types/config-types.ts";
import {
  PLUGIN_SKIP,
  type PluginFunction,
  type PluginHandler,
  type PluginNames,
  type PluginRegistry,
  type TransformHandler,
} from "../types/plugins.ts";
import { compilerTree } from "../utils/compilerTree.ts";

export const pluginsToInitialize: Map<
  string,
  { pluginFn: PluginFunction<PluginNames>; defaults: object }
> = new Map();

const plugins = new Map<string, PluginHandler>();

export function registerPlugin<TPlugin extends PluginNames>(
  name: TPlugin,
  defaults: PluginRegistry[TPlugin],
  pluginFn: PluginFunction<TPlugin>,
): void {
  if (pluginsToInitialize.has(name)) {
    throwError(`Plugin '${name}' is already registered`);
  }

  pluginsToInitialize.set(name, {
    pluginFn: pluginFn as PluginFunction<PluginNames>,
    defaults,
  });
}

export async function initializePlugins(
  config: PencelConfig,
  context: PencelContext,
): Promise<void> {
  compilerTree.start("initialize-plugins");

  for (const [name, { pluginFn, defaults }] of pluginsToInitialize.entries()) {
    const userEntry = config.plugins?.find((p) => {
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
        plugins.set(name, plugin);
      }
    }
  }

  compilerTree.end("initialize-plugins");
}

export async function handlePluginTransformation<
  THandle extends TransformHandler,
>(handle: THandle): Promise<THandle["input"]> {
  let intermediate = handle.input;

  for (const plugin of plugins.values()) {
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
