import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ComponentOptions } from "@pencel/runtime";
import type ts from "typescript";
import type { ClassDeclaration } from "typescript";
import { inject } from "../core/container.ts";
import { Plugins } from "../core/plugin.ts";
import type { ComponentIR } from "./component.ts";
import { IRM, type IRRef } from "./irri.ts";

/**
 * StyleIR is the flat IR representation of processed component styles.
 * Contains both user-provided style references and processed CSS as public readonly fields.
 */
export class StyleIR extends IRM("Style") {
  // User-provided fields from @Component decorator
  readonly styles?: string | string[];
  readonly styleUrl?: string;
  readonly styleUrls?: Record<string, string>;

  // Compiler-resolved final CSS (flat, alongside user fields)
  readonly processedStyles: string;
  readonly processedStyleUrls: Record<string, string>;

  /**
   * Private constructor—use `StyleIR.process()` factory method instead.
   * This ensures styles are fully processed before the IR instance exists.
   *
   * @param userOptions - User-provided style configuration from @Component decorator
   * @param processedStyles - Final processed inline CSS from plugin pipeline
   * @param processedStyleUrls - Final processed styleUrls from plugin pipeline
   */
  private constructor(
    userOptions: ComponentOptions,
    processedStyles: string,
    processedStyleUrls: Record<string, string>,
  ) {
    super();

    // Store user-provided options
    this.styles = userOptions.styles;
    this.styleUrl = userOptions.styleUrl;
    this.styleUrls = userOptions.styleUrls;

    // Store processed styles directly as public fields
    this.processedStyles = processedStyles;
    this.processedStyleUrls = processedStyleUrls;
  }

  /**
   * Async factory method to process component styles.
   * Handles all file I/O, plugin preprocessing/postprocessing, and returns
   * a fully initialized StyleIR with browser-ready CSS.
   *
   * @param sourceFile - TypeScript source file for relative path resolution
   * @param componentOptions - User-provided style configuration
   * @param componentIR - Optional: Reference to the component IR for plugin hooks
   * @returns StyleIR instance with processed styles
   */
  static async process(
    sourceFile: ts.SourceFile,
    componentOptions: ComponentOptions,
    componentIR?: IRRef<ComponentIR, ClassDeclaration>,
  ): Promise<StyleIR> {
    const plugins = inject(Plugins);
    let inlineStyles = "";

    // Collect inline style strings
    if (Array.isArray(componentOptions.styles)) {
      inlineStyles += componentOptions.styles.join("\n");
    } else if (componentOptions.styles) {
      inlineStyles += componentOptions.styles;
    }

    // Helper to resolve paths relative to source file location
    const resolvePath = (path: string): string => {
      return resolve(dirname(sourceFile.fileName), path);
    };

    // Helper to read file contents
    const readFile = (fullPath: string): string => {
      return readFileSync(fullPath, "utf-8");
    };

    // Helper to run a style file through preprocessing and postprocessing
    const processStyleFile = async (
      content: string,
      filePath: string,
    ): Promise<string> => {
      // Run preprocess hook (e.g., SCSS compilation)
      const preprocessed = await plugins.handle({
        hook: "css:preprocess",
        input: content,
        path: filePath,
      });

      // Run postprocess hook (e.g., CSS minification, vendor prefixes)
      const postprocessed = await plugins.handle({
        hook: "css:postprocess",
        input: preprocessed.input,
        path: filePath,
        irr: componentIR,
      });

      return postprocessed.input;
    };

    // Process default styleUrl (if present)
    if (componentOptions.styleUrl) {
      const fullPath = resolvePath(componentOptions.styleUrl);
      const fileContent = readFile(fullPath);
      const processedContent = await processStyleFile(fileContent, fullPath);
      inlineStyles += processedContent;
    }

    // Process all styleUrls (media queries or named variants)
    const processedStyleUrls: Record<string, string> = {};
    if (componentOptions.styleUrls) {
      for (const [key, styleUrl] of Object.entries(
        componentOptions.styleUrls,
      )) {
        const fullPath = resolvePath(styleUrl);
        const fileContent = readFile(fullPath);
        processedStyleUrls[key] = await processStyleFile(fileContent, fullPath);
      }
    }

    // Create IR with user options and processed styles
    return new StyleIR(componentOptions, inlineStyles, processedStyleUrls);
  }
}
