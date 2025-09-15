import { basename } from "node:path";
import type { ComponentOptions } from "@pencel/runtime";
import { dashCase, throwConsumerError } from "@pencel/utils";
import { throwTooManyComponentDecoratorsOnClass } from "src/panics/throwTooManyComponentDecoratorsOnClass.ts";
import {
  fileFromString,
  findClasses,
  findDecorators,
  type SourceFile,
} from "ts-flattered";
import type ts from "typescript";
import { compilerTree } from "../core/compiler.ts";
import { processStyles } from "../transforms/transform-css.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { createPencelMarker, isPencelGeneratedFile } from "../utils/marker.ts";

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
  if (!fileShouldBeProcessed(sourceFile, ctx)) {
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

  transformComponentDecorators(newSourceFile, program, ctx);
  transformComponentPropsDecorators(newSourceFile, program, ctx);

  compilerTree.end(fileNameBased);

  return newSourceFile;
}

export function transformComponentDecorators(
  newSourceFile: ts.SourceFile & SourceFile,
  program: ts.Program,
  ctx: PencelContext,
): void {
  newSourceFile.updateClasses((cls) => {
    cls.updateDecoratorByFilter(
      {
        sourceFile: newSourceFile,
        // TODO: Enable module checking again
        // module: PENCEL_RUNTIME_MODULE_NAME,
        name: PENCEL_COMPONENT_DECORATOR_NAME,
      },
      (decorator) => {
        decorator.updateArgumentObject(0, (obj) => {
          const componentOptions = obj.toRecord() as ComponentOptions;
          const { styles, styleUrls } = processStyles(
            newSourceFile,
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

    return cls;
  });
}

export function transformComponentPropsDecorators(
  newSourceFile: ts.SourceFile & SourceFile,
  program: ts.Program,
  ctx: PencelContext,
): void {
  newSourceFile.updateClasses((cls) => {
    cls.updateDecoratorByFilter(
      {
        sourceFile: newSourceFile,
        // TODO: Enable module checking again
        // module: PENCEL_RUNTIME_MODULE_NAME,
        name: PENCEL_COMPONENT_DECORATOR_NAME,
      },
      (decorator) => {
        decorator.updateArgumentObject(0, (obj) => {
          const componentOptions = obj.toRecord() as ComponentOptions;
          const { styles, styleUrls } = processStyles(
            newSourceFile,
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

    return cls;
  });
}

export function fileShouldBeProcessed(
  sourceFile: ts.SourceFile,
  ctx: PencelContext,
): boolean {
  // don't touch our own generated files
  if (isPencelGeneratedFile(sourceFile)) {
    return false;
  }

  const sourceDecorators = findClasses(sourceFile).flatMap((klass) => {
    const componentDecoratorsOnClass = findDecorators(klass, {
      sourceFile,
      // TODO: Enable module checking again
      // module: PENCEL_RUNTIME_MODULE_NAME,
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
    return false;
  }

  // TODO: Parameterize this
  // if (
  //   isPencelSourceUpToDate(
  //     sourceFile,
  //     program.getSourceFile(getOutputPathForSource(sourceFile, ctx)),
  //   )
  // ) {
  //   return null;
  // }

  return true;
}
