import type { ComponentOptions } from "@pencel/runtime";
import { dashCase, log, throwConsumerError } from "@pencel/utils";
import { readFileSync } from "fs";
import { basename, dirname, resolve } from "path";
import { throwTooManyComponentDecoratorsOnClass } from "src/panics/throwTooManyComponentDecoratorsOnClass.ts";
import { fileFromString, findClasses, findDecorators } from "ts-flattered";
import type ts from "typescript";
import { compilerTree } from "../core/compiler.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import {
  createPencelMarker,
  isPencelGeneratedFile,
  isPencelSourceUpToDate,
} from "../utils/marker.ts";

export const PENCEL_RUNTIME_MODULE_NAME = "@pencel/runtime" as const;
export const PENCEL_COMPONENT_DECORATOR_NAME = "Component" as const;

/**
 * Converts a source pencil component to a transformed pencil component.
 */
export async function transformComponentFile(
  program: ts.Program,
  sourceFile: ts.SourceFile,
  ctx: PencelContext,
): Promise<ts.SourceFile | null> {
  // don't touch our own generated files
  if (isPencelGeneratedFile(sourceFile)) {
    return null;
  }

  const sourceDecorators = findClasses(sourceFile).flatMap((klass) => {
    const componentDecoratorsOnClass = findDecorators(klass, {
      sourceFile,
      module: PENCEL_RUNTIME_MODULE_NAME,
      name: PENCEL_COMPONENT_DECORATOR_NAME,
    });

    if (componentDecoratorsOnClass.length > 1) {
      throwTooManyComponentDecoratorsOnClass(
        sourceFile,
        componentDecoratorsOnClass,
      );
    }

    return componentDecoratorsOnClass;
  });

  if (sourceDecorators.length < 1) {
    return null;
  }

  if (isPencelSourceUpToDate(sourceFile)) {
    log(`Skipping up-to-date file: ${sourceFile.fileName}`);
    return null;
  }

  const fileNameBased = basename(sourceFile.fileName);
  compilerTree.start(fileNameBased);

  const newSourceFile = fileFromString(
    sourceFile.fileName,
    sourceFile.getFullText(),
    sourceFile.languageVersion,
  );

  newSourceFile.prependBanner(createPencelMarker(sourceFile), "line");

  newSourceFile.updateClasses((cls) => {
    cls.updateDecoratorByFilter(
      {
        sourceFile: newSourceFile,
        module: PENCEL_RUNTIME_MODULE_NAME,
        name: PENCEL_COMPONENT_DECORATOR_NAME,
      },
      (decorator) => {
        decorator.updateArgumentObject(0, (obj) => {
          const componentOptions = obj.toRecord() as ComponentOptions;
          const { styles, styleUrls } = processStyles(
            sourceFile,
            componentOptions,
          );

          obj.setMany({
            tag: dashCase(
              cls.name?.text ??
                throwConsumerError("Anonymous classes must have a tag."),
            ),
            styles,
            styleUrls,
          } satisfies ComponentOptions);

          obj.remove("styleUrl" as keyof ComponentOptions);

          return obj;
        });

        return decorator;
      },
    );

    // cls.rename(`${cls.name?.text}Generated`);

    return cls;
  });

  compilerTree.end(fileNameBased);

  return newSourceFile;
}

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
