import { createLog } from "@pencel/utils";
import sass from "sass";
import { registerPlugin } from "src/compiler/core/plugin.ts";
import { PLUGIN_SKIP } from "src/compiler/types/plugins.ts";

const log = createLog("SCSS");

declare module "@pencel/core" {
  interface PluginRegistry {
    scss: {
      enabled?: boolean;
      scssOptions?: sass.StringOptions<"async">;
    };
  }
}

registerPlugin(
  "scss",
  {
    enabled: true,
    scssOptions: {},
  },
  async (options) => {
    if (!options.enabled) {
      return null;
    }

    log("Using SCSS plugin");

    return {
      transform: async (handle) => {
        if (handle.aspect === "css:preprocess") {
          log(`Handle ${handle.path}`);
          const result = await sass.compileStringAsync(handle.input);

          return result.css;
        }

        return PLUGIN_SKIP;
      },
    };
  },
);
