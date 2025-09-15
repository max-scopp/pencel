import { basename } from "path";
import { fileFromString, findClasses, findDecorators } from "ts-flattered";
import type ts from "typescript";
import { compilerTree } from "../core/compiler.ts";
import type { PencelConfig } from "../types/config-types.ts";

export const PENCEL_RUNTIME_MODULE_NAME = "@pencel/runtime" as const;
export const PENCEL_COMPONENT_DECORATOR_NAME = "Component" as const;

/**
 * Converts a source pencil component to a transformed pencil component.
 */
export async function transformComponentFile(
  sourceFile: ts.SourceFile,
  config: PencelConfig,
): Promise<ts.SourceFile | null> {
  const sourceDecorators = findClasses(sourceFile).flatMap((klass) =>
    findDecorators(klass, {
      sourceFile,
      module: PENCEL_RUNTIME_MODULE_NAME,
      name: PENCEL_COMPONENT_DECORATOR_NAME,
    }),
  );

  if (sourceDecorators.length < 1) {
    return null;
  }

  const bn = basename(sourceFile.fileName);
  compilerTree.start(bn);

  const newSourceFile = fileFromString(
    sourceFile.fileName,
    sourceFile.getFullText(),
    sourceFile.languageVersion,
  );

  newSourceFile.updateClasses((cls) => {
    cls.updateDecoratorByFilter(
      {
        sourceFile: newSourceFile,
        module: PENCEL_RUNTIME_MODULE_NAME,
        name: PENCEL_COMPONENT_DECORATOR_NAME,
      },
      (decorator) => {
        decorator.updateArgumentObject(0, (obj) => {
          obj.setMany({
            tagName: cls.name?.text.toLowerCase(),
          });

          return obj;
        });

        return decorator;
      },
    );

    cls.rename(`${cls.name?.text}Generated`);

    return cls;
  });

  compilerTree.end(bn);

  return newSourceFile;
}
