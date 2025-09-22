import { warn } from "node:console";
import { codeFrameColumns } from "@babel/code-frame";
import { createLog } from "@pencel/utils";
import { type ErrorLocation, transform } from "lightningcss";
import { Plugins } from "../compiler/core/plugin.ts";
import { PLUGIN_SKIP } from "../compiler/types/plugins.ts";

const log = createLog("CSS");

function isErrorLocation(err: unknown): err is SyntaxError & ErrorLocation {
  return (
    typeof err === "object" && err !== null && "line" in err && "column" in err
  );
}

Plugins.register(
  "css",
  {
    enabled: true,
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
        if (handle.aspect === "css:postprocess") {
          log(`Handle ${handle.path}`);

          try {
            const result = transform({
              ...options.lightningCssOptions,
              code: Buffer.from(handle.input),
              filename: handle.path,
            });

            result.warnings.forEach((warning) => {
              warn(`${warning.message}`);
            });

            return Promise.resolve(result.code.toString());
          } catch (err) {
            if (isErrorLocation(err)) {
              warn(
                `CSS Syntax Error in ${handle.path}:${err.line}:${err.column}\n\t${err.message}`,
              );
              return Promise.resolve(handle.input);
            }

            throw err;
          }
        }

        return Promise.resolve(PLUGIN_SKIP);
      },
    });
  },
);
