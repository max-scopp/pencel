import { dirname } from "node:path";
import { createLog } from "@pencel/utils";
import * as sass from "sass-embedded";
import { PencelPlugin, Plugins } from "../compiler/core/plugin.ts";

const log = createLog("SCSS");

interface ScssPluginOptions {
  scssOptions?: {
    logger?: {
      warn?: (message: string, options: unknown) => void;
      debug?: (message: string, options: unknown) => void;
    };
    loadPaths?: string[];
  };
}

export interface ScssPluginRegistry {
  scss: {
    class: ScssPlugin;
    options: ScssPluginOptions;
  };
}

class ScssPlugin extends PencelPlugin {
  readonly #options: ScssPluginOptions;

  constructor(options: ScssPluginOptions) {
    super();
    this.#options = options;

    this.handle("css:preprocess", async (hook) => {
      log(`Handle ${hook.path}`);
      const fileDir = dirname(hook.path);

      const result = await sass.compileStringAsync(hook.input, {
        ...this.#options.scssOptions,
        loadPaths: [fileDir, ...(this.#options.scssOptions?.loadPaths || [])],
      });

      hook.input = result.css;
    });
  }
}

Plugins.register("scss", ScssPlugin, {
  scssOptions: {
    logger: {
      warn(_message, _options) {
        // warn(`${message} \n${options.span?.context}`);
      },
      debug(_message, _options) {
        // debug(`${message} \n${options.span?.context}`);
      },
    },
  },
});
