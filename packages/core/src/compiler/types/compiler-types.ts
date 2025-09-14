import type { PencilRuntimeConfig } from "@pencel/runtime";

/**
 * Metadata for a component property decorated with @Prop
 */
export interface PencilComponentPropMetadata {
  computedType: string;
  coerce: string | null;
}

/**
 * Complete metadata extracted from a component class decorated with @Component
 */
export interface PencilComponentMetadata {
  className: string;
  tagName?: string;
  states: string[];
  props: Map<string, PencilComponentPropMetadata>;
  styles: {
    defaultUrl?: string;
    modeUrls?: Record<string, string>;
    inline?: string[];
  };
}

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

export interface PencilConfig {
  /**
   * The input folder or glob pattern to process.
   * Defaults to the tsconfig next to the config file.
   */
  input:
    | string
    | {
        /**
         * Path to the tsconfig.json file to use, relative to this config file.
         */
        tsconfig: string;
      };
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
  code: string;
  metadata: ComponentMetadata;
}

export interface TransformResults {
  [filePath: string]: TransformResult;
}
