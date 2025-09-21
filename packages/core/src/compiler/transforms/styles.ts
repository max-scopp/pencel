import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ComponentOptions } from "@pencel/runtime";
import type ts from "typescript";
import { inject } from "../core/container.ts";
import { Plugins } from "../core/plugin.ts";

export class Styles {
  plugins: Plugins = inject(Plugins);

  async process(
    sourceFile: ts.SourceFile,
    componentOptions: ComponentOptions,
  ): Promise<Pick<ComponentOptions, "styles" | "styleUrls">> {
    let alwaysStyles = "";

    if (Array.isArray(componentOptions.styles)) {
      alwaysStyles += componentOptions.styles.join("\n");
    } else {
      alwaysStyles += componentOptions.styles ?? "";
    }

    const getPath = (path: string) => {
      return resolve(dirname(sourceFile.fileName), path);
    };

    const getContent = (fullPath: string) => {
      return readFileSync(fullPath, "utf-8");
    };

    if (componentOptions.styleUrl) {
      const path = getPath(componentOptions.styleUrl);
      const input = getContent(path);

      alwaysStyles += await this.plugins.handlePlugins({
        aspect: "css:postprocess",
        input: await this.plugins.handlePlugins({
          aspect: "css:preprocess",
          input,
          path,
        }),
        path,
      });
    }

    const inlinedStyleUrls: Record<string, string> = {};

    if (componentOptions.styleUrls) {
      for (const [media, styleUrl] of Object.entries(
        componentOptions.styleUrls,
      )) {
        const path = getPath(styleUrl);
        const input = getContent(path);

        inlinedStyleUrls[media] = await this.plugins.handlePlugins({
          aspect: "css:postprocess",
          input: await this.plugins.handlePlugins({
            aspect: "css:preprocess",
            input,
            path,
          }),
          path,
        });
      }
    }

    return { styles: alwaysStyles, styleUrls: inlinedStyleUrls };
  }
}
