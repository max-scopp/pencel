import type ts from "typescript";
import { inject } from "../core/container.ts";
import { SourceFileFactory } from "../factories/source-file-factory.ts";
import { ComponentIRBuilder } from "../ir/component-ir-builder.ts";
import { FileProcessor } from "../processors/file-processor.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { ComponentDecoratorTransformer } from "./component-decorator-transformer.ts";
import { PropsDecoratorTransformer } from "./props-decorator-transformer.ts";

export class ComponentFileTransformer {
  readonly fileProcessor: FileProcessor = inject(FileProcessor);
  readonly sourceFileFactory: SourceFileFactory = inject(SourceFileFactory);
  readonly componentIRBuilder: ComponentIRBuilder = inject(ComponentIRBuilder);

  async transform(
    sourceFile: ts.SourceFile,
    program: ts.Program,
    ctx: PencelContext,
  ): Promise<ts.SourceFile | null> {
    if (!this.fileProcessor.shouldProcess(sourceFile, ctx)) {
      return null;
    }

    // Create transformed file
    const transformedFile =
      this.sourceFileFactory.createTransformedFile(sourceFile);

    // Build IR while transforming
    const componentIR =
      this.componentIRBuilder.createFromSourceFile(transformedFile);

    // Create transformers with IR reference
    const componentTransformer = new ComponentDecoratorTransformer(componentIR);
    const propsTransformer = new PropsDecoratorTransformer(
      program,
      componentIR,
    );

    // Execute transformations
    await componentTransformer.transform(transformedFile, ctx);
    await propsTransformer.transform(transformedFile, ctx);

    // Finalize IR and register for later .d.ts generation
    this.componentIRBuilder.registerComponent(componentIR);

    // Register the transformed file
    this.sourceFileFactory.registerTransformedFile(
      transformedFile,
      sourceFile.fileName,
    );

    return transformedFile;
  }
}
