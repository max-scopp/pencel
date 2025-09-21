import { createLog } from "@pencel/utils";
// import { transform } from "lightningcss";
import { Plugins } from "../compiler/core/plugin.ts";
import { PLUGIN_SKIP } from "../compiler/types/plugins.ts";

const log = createLog("CSS");

Plugins.register(
  "css",
  {
    enabled: false,
    lightningCssOptions: {
      minify: true,
    },
  },
  (options) => {
    if (!options.enabled) {
      return Promise.resolve(null);
    }

    log("Using CSS plugin");

    return Promise.resolve({
      transform: (handle) => {
        // if (handle.aspect === "css:postprocess") {
        //   log(`Handle ${handle.path}`);

        //   const result = transform({
        //     ...options.lightningCssOptions,
        //     code: Buffer.from(handle.input),
        //     filename: handle.path,
        //   });

        //   return Promise.resolve(result.code.toString());
        // }

        return Promise.resolve(PLUGIN_SKIP);
      },
    });
  },
);
