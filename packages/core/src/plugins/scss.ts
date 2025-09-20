import { dirname } from "node:path";
import { createDebugLog, createLog } from "@pencel/utils";
import { Logger } from "sass";
import * as sass from "sass-embedded";
import { Plugins } from "../compiler/core/plugin.ts";
import { PLUGIN_SKIP } from "../compiler/types/plugins.ts";

const log = createLog("SCSS");
const debugLog = createDebugLog("SCSS");

declare module "@pencel/core" {
  interface PluginRegistry {
    scss: {
      enabled?: boolean;
      scssOptions?: sass.StringOptions<"async">;
    };
  }
}

Plugins.register(
  "scss",
  {
    enabled: true,
    scssOptions: {
      logger: Logger.silent,
    },
  },
  (options) => {
    if (!options.enabled) {
      return Promise.resolve(null);
    }

    log("Using SCSS plugin");

    return Promise.resolve({
      transform: async (handle) => {
        if (handle.aspect === "css:preprocess") {
          debugLog(`Handle ${handle.path}`);

          // Get the directory of the current SCSS file to resolve relative imports
          const fileDir = dirname(handle.path);

          const result = await sass.compileStringAsync(handle.input, {
            ...options.scssOptions,
            loadPaths: [fileDir, ...(options.scssOptions?.loadPaths || [])],
          });

          return Promise.resolve(result.css);
        }

        return Promise.resolve(PLUGIN_SKIP);
      },
    });
  },
);
