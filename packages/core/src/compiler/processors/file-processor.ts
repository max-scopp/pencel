import { findClasses, findDecorators } from "ts-flattered";
import type ts from "typescript";
import { throwTooManyComponentDecoratorsOnClass } from "../../panics/throwTooManyComponentDecoratorsOnClass.ts";
import { PENCEL_DECORATORS } from "../transformers/constants.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";

export class FileProcessor {
  shouldProcess(sourceFile: ts.SourceFile, _ctx: PencelContext): boolean {
    // Don't touch our own generated files
    if (isPencelGeneratedFile(sourceFile)) {
      return false;
    }

    const componentDecorators = this.findComponentDecorators(sourceFile);
    this.validateComponentDecorators(sourceFile, componentDecorators);

    return componentDecorators.length > 0;
  }

  private findComponentDecorators(sourceFile: ts.SourceFile): ts.Decorator[] {
    return findClasses(sourceFile).flatMap((klass) => {
      return findDecorators(klass, {
        sourceFile,
        // TODO: Enable module checking again
        // module: PENCEL_RUNTIME_MODULE_NAME,
        name: PENCEL_DECORATORS.Component,
      });
    });
  }

  private validateComponentDecorators(
    sourceFile: ts.SourceFile,
    decorators: ts.Decorator[],
  ): void {
    // Group decorators by their containing class
    const decoratorsByClass = new Map<string, ts.Decorator[]>();

    for (const decorator of decorators) {
      // Get class name from decorator's parent node
      const classDeclaration = decorator.parent as ts.ClassDeclaration;
      const className = classDeclaration?.name?.text || "anonymous";

      const existing = decoratorsByClass.get(className) || [];
      decoratorsByClass.set(className, [...existing, decorator]);
    }

    // Check for multiple Component decorators on the same class
    for (const [, classDecorators] of decoratorsByClass) {
      if (classDecorators.length > 1) {
        throwTooManyComponentDecoratorsOnClass(sourceFile, classDecorators);
      }
    }
  }
}
