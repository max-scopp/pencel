import { Config } from "../config.ts";
import type {
  BasePluginOptions,
  HookHandler,
  HookKind,
  PluggableHooks,
  PluginNames,
  PluginOptionsOf,
} from "../types/plugins.ts";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";

export class PencelPlugin {
  readonly #plugins = inject(Plugins);

  handle<TKind extends HookKind>(
    hook: TKind,
    handler: HookHandler<TKind>,
  ): void {
    this.#plugins.registerHook(hook, handler);
  }
}

type PluginConstructor<TName extends PluginNames> = {
  new (userOptions: PluginOptionsOf<TName>): PencelPlugin;
};

export class Plugins {
  static readonly registeredPlugins: Map<
    PluginNames,
    [PluginConstructor<PluginNames>, object]
  > = new Map();

  static register<TName extends PluginNames>(
    name: TName,
    pluginClass: PluginConstructor<TName>,
    defaultOptions?: PluginOptionsOf<TName>,
  ): void {
    perf.start(`register-plugin:${name}`);
    Plugins.registeredPlugins.set(name, [pluginClass, defaultOptions ?? {}]);
    perf.end(`register-plugin:${name}`);
  }

  readonly #config = inject(Config);

  readonly #instances: Map<string, unknown> = new Map();
  readonly #hookHandlers: Map<
    HookKind,
    ((hook: PluggableHooks) => void | Promise<void>)[]
  > = new Map();

  async initialize(): Promise<void> {
    perf.start("initialize-plugins");

    const initPromises = Array.from(Plugins.registeredPlugins.entries()).map(
      async ([name, [klass, defaultOptions]]) => {
        const requiredPlugins: Array<PluginNames> = [];

        const userOptions = this.#config.getUserOptionsForPlugin(name);
        const mergedOptions = {
          ...defaultOptions,
          ...userOptions,
        } as BasePluginOptions;

        if (
          !requiredPlugins.includes(name) &&
          mergedOptions.enabled === false
        ) {
          return;
        }

        perf.start(`initialize-plugin:${name}`);
        const instance = new klass(
          mergedOptions as PluginOptionsOf<typeof name>,
        );
        this.#instances.set(name, instance);
        perf.end(`initialize-plugin:${name}`);
      },
    );

    await Promise.all(initPromises);
    perf.end("initialize-plugins");
  }

  async handle<THook extends PluggableHooks>(hook: THook): Promise<THook> {
    perf.start(`handle-hook:${hook.hook}`);

    const handlers = this.#hookHandlers.get(hook.hook) ?? [];
    for (const handler of handlers) {
      await handler(hook);
    }

    perf.end(`handle-hook:${hook.hook}`);
    return hook;
  }

  /**
   * Execute hook handlers synchronously (for render-time transformations).
   * Handlers must be synchronous to work with this method.
   */
  handleSync<THook extends PluggableHooks>(hook: THook): THook {
    perf.start(`handle-hook-sync:${hook.hook}`);

    const handlers = this.#hookHandlers.get(hook.hook) ?? [];
    for (const handler of handlers) {
      handler(hook);
    }

    perf.end(`handle-hook-sync:${hook.hook}`);
    return hook;
  }

  registerHook<TKind extends HookKind>(
    hookKind: TKind,
    handler: HookHandler<TKind>,
  ): void {
    const handlers = this.#hookHandlers.get(hookKind) ?? [];
    handlers.push(handler as (hook: PluggableHooks) => void | Promise<void>);
    this.#hookHandlers.set(hookKind, handlers);
  }
}
