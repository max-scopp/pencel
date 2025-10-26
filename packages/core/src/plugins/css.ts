import { warn } from "node:console";
import { createLog } from "@pencel/utils";
import { type ErrorLocation, transform } from "lightningcss";
import { PencelPlugin, Plugins } from "../compiler/core/plugin.ts";

const log = createLog("CSS");

function isErrorLocation(err: unknown): err is SyntaxError & ErrorLocation {
  return (
    typeof err === "object" && err !== null && "line" in err && "column" in err
  );
}

declare module "../compiler/types/plugins.ts" {
  interface PluginRegistry {
    css: {
      class: CssPlugin;
      options: CssPluginOptions;
    };
  }
}

interface CssPluginOptions {
  lightningCssOptions?: {
    minify?: boolean;
  };
}

class CssPlugin extends PencelPlugin {
  readonly #options: CssPluginOptions;

  constructor(options: CssPluginOptions) {
    super();
    this.#options = options;

    this.handle("css:postprocess", (hook) => {
      log(`Handle ${hook.path}`);

      try {
        const result = transform({
          ...this.#options.lightningCssOptions,
          code: Buffer.from(hook.input),
          filename: hook.path,
        });

        result.warnings.forEach((warning) => {
          warn(`${warning.message}`);
        });

        hook.input = result.code.toString();
      } catch (err) {
        if (isErrorLocation(err)) {
          warn(
            `CSS Syntax Error in ${hook.path}:${err.line}:${err.column}\n\t${err.message}`,
          );
        } else {
          throw err;
        }
      }
    });
  }
}

Plugins.register("css", CssPlugin, {
  lightningCssOptions: {
    minify: true,
  },
});
