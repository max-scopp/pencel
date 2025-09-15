import type { PencilRuntimeConfig } from "@pencel/runtime";
import type { PluginsList } from "./plugins.js";

interface PencilOutputToFolder {
  mode: "folder";
  path: string;
}

interface PencilOutputAside {
  mode: "aside";

  /**
   * A regular expression that's using the basename of the file
   * to determine the output file name.
   */
  replace: RegExp;
}

export interface PencelConfig {
  /**
   * The input folder or glob pattern to process.
   * Defaults to the tsconfig next to the config file.
   */
  input?:
    | string
    | {
        /**
         * Path to the tsconfig.json file to use, relative to this config file.
         */
        tsconfig: string;
      };

  plugins: PluginsList;

  output?: PencilOutputToFolder | PencilOutputAside;
  runtime?: PencilRuntimeConfig;
}

export interface ComponentMetadata {
  tagName?: string;
  selector?: string;
  extends?: string;
  tagNamespace?: string;
}

export interface TransformResult {
  meta: ComponentMetadata;
}

export type TransformResults = Map<string, TransformResult[]>;
