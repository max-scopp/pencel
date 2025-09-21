import { dirname } from "node:path";
import { createLog } from "@pencel/utils";
import { Logger } from "sass";
import * as sass from "sass-embedded";
import { Plugins } from "../compiler/core/plugin.ts";
import { PLUGIN_SKIP } from "../compiler/types/plugins.ts";

const log = createLog("SCSS");

Plugins.register(
  "scss",
  {
    enabled: false,
    scssOptions: {
      logger: Logger.silent,
      style: "compressed",
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
