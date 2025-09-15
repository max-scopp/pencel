import { registerPlugin } from "src/compiler/core/plugin.ts";

declare module "@pencil/core" {
  interface PluginOptions {
    css: CssPluginOptions;
  }
}

export interface CssPluginOptions {
  /**
   * Enable or disable the plugin (default: true)
   */
  enabled?: boolean;
}

registerPlugin<CssPluginOptions>(
  "css",
  {
    enabled: true,
  },
  (options, context) => {
    console.log(
      "CSS Plugin executed with options:",
      options,
      "and context:",
      context,
    );
  },
);
