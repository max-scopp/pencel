import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ComponentOptions } from "@pencel/runtime";
import type ts from "typescript";

export function processStyles(
  sourceFile: ts.SourceFile,
  componentOptions: ComponentOptions,
): Pick<ComponentOptions, "styles" | "styleUrls"> {
  let alwaysStyles = "";

  if (Array.isArray(componentOptions.styles)) {
    alwaysStyles += componentOptions.styles.join("\n");
  } else {
    alwaysStyles += componentOptions.styles ?? "";
  }

  const inlineRelativePath = (path: string) =>
    readFileSync(resolve(dirname(sourceFile.fileName), path), "utf-8");

  if (componentOptions.styleUrl) {
    alwaysStyles += inlineRelativePath(componentOptions.styleUrl);
  }

  const inlinedStyleUrls = Object.entries(
    componentOptions.styleUrls ?? {},
  ).reduce(
    (acc, [media, styleUrl]) => {
      acc[media] = inlineRelativePath(styleUrl);
      return acc;
    },
    {} as Record<string, string>,
  );

  return { styles: alwaysStyles, styleUrls: inlinedStyleUrls };
}
