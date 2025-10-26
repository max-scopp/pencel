import { dirname } from "node:path";
import { createLog } from "@pencel/utils";
import * as sass from "sass-embedded";
import { PencelPlugin, Plugins } from "../compiler/core/plugin.ts";
import type { CssPreprocessHook } from "../compiler/types/plugins.ts";

const log = createLog("SCSS");

declare module "../compiler/types/plugins.ts" {
  interface PluginRegistry {
    scss: {
      class: ScssPlugin;
      options: ScssPluginOptions;
    };
  }
}

interface ScssPluginOptions {
  enabled: boolean;
  scssOptions?: {
    logger?: {
      warn?: (message: string, options: unknown) => void;
      debug?: (message: string, options: unknown) => void;
    };
    loadPaths?: string[];
  };
}

class ScssPlugin extends PencelPlugin {
  readonly #options: ScssPluginOptions;

  constructor(options: ScssPluginOptions) {
    super();
    this.#options = options;

    if (this.#options.enabled) {
      log("Using SCSS plugin");
      this.handle("css:preprocess", this.#handleCssPreprocess.bind(this));
    }
  }

  #handleCssPreprocess(hook: CssPreprocessHook): void {
    // Get the directory of the current SCSS file to resolve relative imports
    const fileDir = dirname(hook.path);

    sass
      .compileStringAsync(hook.input, {
        ...this.#options.scssOptions,
        loadPaths: [fileDir, ...(this.#options.scssOptions?.loadPaths || [])],
      })
      .then((result) => {
        hook.input = result.css;
      })
      .catch((err) => {
        console.error(`SCSS compilation error in ${hook.path}:`, err);
        throw err;
      });
  }
}

Plugins.register("scss", ScssPlugin, {
  enabled: false,
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
