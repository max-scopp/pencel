import { createLog } from "@pencel/utils";
import type { TransformOptions } from "lightningcss";
import { Plugins } from "../compiler/core/plugin.ts";
import { PLUGIN_SKIP } from "../compiler/types/plugins.ts";

const log = createLog("CSS");

declare module "@pencel/core" {
  interface PluginRegistry {
    css: {
      enabled?: boolean;
      lightningCssOptions?: Omit<TransformOptions<any>, "code" | "filename">;
    };
  }
}

Plugins.register(
  "css",
  {
    enabled: true,
    lightningCssOptions: {},
  },
  (options) => {
    if (!options.enabled) {
      return Promise.resolve(null);
    }

    log("Using CSS plugin");

    return Promise.resolve({
      transform: (handle) => {
        // if (handle.aspect === "css:postprocess") {

        // debugLog(`Handle ${handle.path}`);
        // const result = cssTransform({
        //   ...options.lightningCssOptions,
        //   code: Buffer.from(handle.input),
        //   filename: handle.path,
        // });

        // return Promise.resolve(result.code.toString());
        // }

        return Promise.resolve(PLUGIN_SKIP);
      },
    });
  },
);
