import { createLog } from "@pencel/utils";
import * as csso from "csso";
import { registerPlugin } from "../compiler/core/plugin.ts";
import { PLUGIN_SKIP } from "../compiler/types/plugins.ts";

const log = createLog("CSS");

declare module "@pencel/core" {
  interface PluginRegistry {
    css: {
      enabled?: boolean;
      cssoOptions?: csso.MinifyOptions & csso.CompressOptions;
    };
  }
}

registerPlugin(
  "css",
  {
    enabled: true,
    cssoOptions: {
      comments: false,
    },
  },
  (options) => {
    if (!options.enabled) {
      return Promise.resolve(null);
    }

    log("Using CSS plugin");

    return Promise.resolve({
      transform: (handle) => {
        if (handle.aspect === "css:postprocess") {
          log(`Handle ${handle.path}`);
          const result = csso.minify(handle.input, options.cssoOptions);

          return Promise.resolve(result.css);
        }

        return Promise.resolve(PLUGIN_SKIP);
      },
    });
  },
);
