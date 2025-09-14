import { throwWithCodeFrame } from "@pencel/utils";
import { highlightDecorators } from "ts-flattered";
import type ts from "typescript";

export function throwTooManyComponentDecoratorsOnClass(
  sourceFile: ts.SourceFile,
  klass: ts.ClassDeclaration,
  decorators: ts.Decorator[],
): never {
  throwWithCodeFrame(
    [
      `Multiple @Component decorators found on class ${klass.name?.getText() ?? "Unknown"}.`,
      `Only one is allowed per class.`,
    ],
    highlightDecorators(sourceFile, decorators, {
      message: "Multiple @Component decorators found here.",
    }),
  );
}
