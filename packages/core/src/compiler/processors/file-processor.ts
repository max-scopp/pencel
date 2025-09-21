import { createLog } from "@pencel/utils";
import { basename } from "path";
import { findClasses, findDecorators } from "ts-flattered";
import type ts from "typescript";
import { throwTooManyComponentDecoratorsOnClass } from "../../panics/throwTooManyComponentDecoratorsOnClass.ts";
import { CompilerContext } from "../core/compiler-context.ts";
import { inject } from "../core/container.ts";
import { Program } from "../core/program.ts";
import { SourceFiles } from "../factories/source-files.ts";
import { ComponentIR } from "../ir/component-ir.ts";
import { IR } from "../ir/ir.ts";
import { ComponentDecoratorTransformer } from "../transformers/component-decorator-transformer.ts";
import { PENCEL_DECORATORS } from "../transformers/constants.ts";
import { PropsDecoratorTransformer } from "../transformers/props-decorator-transformer.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";
import { perf } from "../utils/perf.ts";

export class FileProcessor {
  readonly program: Program = inject(Program);
  readonly context: CompilerContext = inject(CompilerContext);
  readonly ir: IR = inject(IR);
  readonly sourceFileFactory: SourceFiles = inject(SourceFiles);

  async process(sourceFile: ts.SourceFile): Promise<ts.SourceFile | null> {
    const fname = basename(sourceFile.fileName);

    if (!this.shouldProcess(sourceFile)) {
      // log(`Skipping ${fname}`);
      return null;
    }

    perf.start(`transform:${fname}`);

    const transformedSourceFile =
      this.sourceFileFactory.createTransformedFile(sourceFile);

    const componentIR = new ComponentIR(transformedSourceFile);

    const componentTransformer = new ComponentDecoratorTransformer(componentIR);
    const propsTransformer = new PropsDecoratorTransformer(
      this.program.ts,
      componentIR,
    );

    await componentTransformer.transform(transformedSourceFile, this.context);
    await propsTransformer.transform(transformedSourceFile, this.context);

    this.ir.components.push(componentIR);

    this.sourceFileFactory.registerTransformedFile(
      transformedSourceFile,
      sourceFile.fileName,
    );

    perf.end(`transform:${fname}`);
    return transformedSourceFile;
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
