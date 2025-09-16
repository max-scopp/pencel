import { createDebugLog, createLog } from "@pencel/utils";
import * as lightningcss from "lightningcss";
import { registerPlugin } from "../compiler/core/plugin.ts";
import { PLUGIN_SKIP } from "../compiler/types/plugins.ts";

const log = createLog("CSS");
const debugLog = createDebugLog("CSS");

declare module "@pencel/core" {
  interface PluginRegistry {
    css: {
      enabled?: boolean;
      lightningCssOptions?: Omit<
        lightningcss.TransformOptions<any>,
        "code" | "filename"
      >;
    };
  }
}

registerPlugin(
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
        if (handle.aspect === "css:postprocess") {
          debugLog(`Handle ${handle.path}`);
          const result = lightningcss.transform({
            ...options.lightningCssOptions,
            code: Buffer.from(handle.input),
            filename: handle.path,
          });

          return Promise.resolve(result.code.toString());
        }

        return Promise.resolve(PLUGIN_SKIP);
      },
    });
  },
);
