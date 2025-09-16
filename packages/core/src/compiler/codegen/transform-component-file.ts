import { basename } from "node:path";
import type { ComponentOptions, PropOptions } from "@pencel/runtime";
import { dashCase, throwConsumerError } from "@pencel/utils";
import {
  computeConstructorType,
  fileFromString,
  findClasses,
  findDecorators,
  type SourceFile,
} from "ts-flattered";
import type ts from "typescript";
import { throwTooManyComponentDecoratorsOnClass } from "../../panics/throwTooManyComponentDecoratorsOnClass.ts";
import { compilerTree } from "../core/compiler.ts";
import { processStyles } from "../transforms/process-styles.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { createPencelMarker, isPencelGeneratedFile } from "../utils/marker.ts";

export const PENCEL_RUNTIME_MODULE_NAME = "@pencel/runtime" as const;
export const PENCEL_DECORATORS = {
  Component: "Component" as const,
  Prop: "Prop" as const,
  State: "State" as const,
  Event: "Event" as const,
  Listen: "Listen" as const,
  Store: "Store" as const,
  Connected: "Connected" as const,
};

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
        name: PENCEL_DECORATORS.Component,
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
    cls.updatePropertiesByFilter(
      (prop) =>
        findDecorators(prop, {
          sourceFile: newSourceFile,
          // TODO: Enable module checking again
          // module: PENCEL_RUNTIME_MODULE_NAME,
          name: PENCEL_DECORATORS.Prop,
        }).length > 0,
      (prop) => {
        prop.updateDecoratorByName(PENCEL_DECORATORS.Prop, (decorator) => {
          decorator.updateArgumentObject(0, (obj) => {
            obj.setMany({
              type: computeConstructorType(program.getTypeChecker(), prop.type),
            } satisfies { [key in keyof PropOptions]: unknown });

            return obj;
          });

          return decorator;
        });

        return prop;
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
      name: PENCEL_DECORATORS.Component,
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
