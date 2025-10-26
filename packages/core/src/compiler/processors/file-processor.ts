import { findClasses, findDecorators } from "ts-flattered";
import type ts from "typescript";
import { throwTooManyComponentDecoratorsOnClass } from "../../panics/throwTooManyComponentDecoratorsOnClass.ts";
import { ComponentTypings } from "../codegen/component-typings.ts";
import { inject } from "../core/container.ts";
import { Plugins } from "../core/plugin.ts";
import { FileIR } from "../ir/file.ts";
import { IRRef } from "../ir/ref.ts";
import { PENCEL_DECORATORS } from "../transformers/constants.ts";
import { FileTransformer } from "../transformers/file.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";

export class FileProcessor {
  readonly plugins: Plugins = inject(Plugins);

  readonly componentTypings: ComponentTypings = inject(ComponentTypings);

  #fileTransformer = inject(FileTransformer);

  async process(sourceFile: ts.SourceFile): Promise<FileIR | null> {
    if (!this.shouldProcess(sourceFile)) {
      return null;
    }

    const file = new FileIR(sourceFile);
    this.#fileTransformer.transform(new IRRef(file, sourceFile));

    await this.componentTypings.createTypings(sourceFile as any);

    await this.plugins.handle({
      hook: "codegen",
      input: sourceFile,
    });

    return file;
  }

  shouldProcess(sourceFile: ts.SourceFile): boolean {
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
