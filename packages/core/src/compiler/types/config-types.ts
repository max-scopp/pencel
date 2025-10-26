import type { PencilRuntimeConfig } from "@pencel/runtime";
import type { PluginDefs } from "./plugins.ts";

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
interface PencelOutputAside {
  /**
   * @default "pen"
   */
  inputQualifier: string;

  /**
   * @default "gen"
   */
  outputQualifier: string;
}

/**
 * Pencel's Core configuration interface
 */
export interface PencelConfig {
  /**
   * By default, it's using the `tsconfig.pencel.json` to resolve source components.
   *
   * @default tsconfig.pencel.json
   */
  input?: {
    /**
     * A tsconfig to use to discover components.
     * @default tsconfig.pencel.json
     */
    tsconfig: string;
  };

  /**
   * Right now, you can only emit next to the source.
   */
  output?: PencelOutputAside;

  plugins?: PluginDefs;

  runtime?: PencilRuntimeConfig;
}
