import { createLog } from "@pencel/utils";
import sass from "sass";
import { registerPlugin } from "../compiler/core/plugin.ts";
import { PLUGIN_SKIP } from "../compiler/types/plugins.ts";

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
  (options) => {
    if (!options.enabled) {
      return Promise.resolve(null);
    }

    log("Using SCSS plugin");

    return Promise.resolve({
      transform: async (handle) => {
        if (handle.aspect === "css:preprocess") {
          log(`Handle ${handle.path}`);
          const result = await sass.compileStringAsync(handle.input);

          return Promise.resolve(result.css);
        }

        return Promise.resolve(PLUGIN_SKIP);
      },
    });
  },
);
