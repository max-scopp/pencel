import type { PencilRuntimeConfig } from "@pencel/runtime";
import type { PluginDefs } from "./plugins.ts";

/**
 * Pencel's Core configuration interface
 */
export interface PencelConfig {
  input?: {
    /**
     * @default "pen"
     */
    qualifier: string;
  };

  /**
   * Pencel treats files using the pattern `<basename>.<qualifier>.<ext>`.
   *
   * It discovers components via `inputQualifier` and emits output files
   * next to them using `outputQualifier`.
   *
   * Example:
   *   component/my-component.pen.ts
   * becomes:
   *   component/my-component.gen.ts
   */
  output?: {
    /**
     * @default "gen"
     */
    qualifier: string;
  };

  /**
   * @default "tsconfig.json"
   */
  tsconfig?: string;

  plugins?: PluginDefs;

  runtime?: PencilRuntimeConfig;
}
