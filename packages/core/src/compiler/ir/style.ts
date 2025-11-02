import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ComponentOptions } from "@pencel/runtime";
import type ts from "typescript";
import type { ClassDeclaration } from "typescript";
import { inject } from "../core/container.ts";
import { Plugins } from "../core/plugin.ts";
import type { ComponentIR } from "./component.ts";
import { IRM, type IRRef } from "./irri.ts";

export class StyleIR extends IRM("Style") {
  readonly styles?: string | string[];
  readonly styleUrl?: string;
  readonly styleUrls?: Record<string, string>;

  readonly processedStyles: string;
  readonly processedStyleUrls: Record<string, string>;

  /**
   * Private constructor—use `StyleIR.process()` factory method instead.
   */
  private constructor(
    userOptions: ComponentOptions,
    processedStyles: string,
    processedStyleUrls: Record<string, string>,
  ) {
    super();

    this.styles = userOptions.styles;
    this.styleUrl = userOptions.styleUrl;
    this.styleUrls = userOptions.styleUrls;

    this.processedStyles = processedStyles;
    this.processedStyleUrls = processedStyleUrls;
  }

  /**
   * Async factory method to process component styles through plugin pipeline.
   */
  static async process(
    sourceFile: ts.SourceFile,
    componentOptions: ComponentOptions,
    componentIR?: IRRef<ComponentIR, ClassDeclaration>,
  ): Promise<StyleIR> {
    const plugins = inject(Plugins);
    let inlineStyles = "";

    if (Array.isArray(componentOptions.styles)) {
      inlineStyles += componentOptions.styles.join("\n");
    } else if (componentOptions.styles) {
      inlineStyles += componentOptions.styles;
    }

    const resolvePath = (path: string): string => {
      return resolve(dirname(sourceFile.fileName), path);
    };

    const readFile = (fullPath: string): string => {
      return readFileSync(fullPath, "utf-8");
    };

    const processStyleFile = async (content: string, filePath: string): Promise<string> => {
      const preprocessed = await plugins.handle({
        hook: "css:preprocess",
        input: content,
        path: filePath,
      });

      const postprocessed = await plugins.handle({
        hook: "css:postprocess",
        input: preprocessed.input,
        path: filePath,
        irr: componentIR,
      });

      return postprocessed.input;
    };

    if (componentOptions.styleUrl) {
      const fullPath = resolvePath(componentOptions.styleUrl);
      const fileContent = readFile(fullPath);
      const processedContent = await processStyleFile(fileContent, fullPath);
      inlineStyles += processedContent;
    }

    const processedStyleUrls: Record<string, string> = {};
    if (componentOptions.styleUrls) {
      for (const [key, styleUrl] of Object.entries(componentOptions.styleUrls)) {
        const fullPath = resolvePath(styleUrl);
        const fileContent = readFile(fullPath);
        processedStyleUrls[key] = await processStyleFile(fileContent, fullPath);
      }
    }

    return new StyleIR(componentOptions, inlineStyles, processedStyleUrls);
  }
}
