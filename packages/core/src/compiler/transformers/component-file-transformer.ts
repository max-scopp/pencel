import { Compiler } from "@pencel/core";
import type ts from "typescript";
import { inject } from "../core/container.ts";
import { Program } from "../core/program.ts";
import { SourceFileFactory } from "../factories/source-file-factory.ts";
import { ComponentIRBuilder } from "../ir/component-ir-builder.ts";
import { FileProcessor } from "../processors/file-processor.ts";
import { ComponentDecoratorTransformer } from "./component-decorator-transformer.ts";
import { PropsDecoratorTransformer } from "./props-decorator-transformer.ts";

export class ComponentFileTransformer {
  readonly compiler: Compiler = inject(Compiler);
  readonly program: Program = inject(Program);

  readonly fileProcessor: FileProcessor = inject(FileProcessor);
  readonly sourceFileFactory: SourceFileFactory = inject(SourceFileFactory);
  readonly componentIRBuilder: ComponentIRBuilder = inject(ComponentIRBuilder);

  async transform(sourceFile: ts.SourceFile): Promise<ts.SourceFile | null> {
    if (!this.fileProcessor.shouldProcess(sourceFile, this.compiler.context)) {
      return null;
    }

    const transformedFile =
      this.sourceFileFactory.createTransformedFile(sourceFile);

    const componentIR =
      this.componentIRBuilder.createFromSourceFile(transformedFile);

    const componentTransformer = new ComponentDecoratorTransformer(componentIR);
    const propsTransformer = new PropsDecoratorTransformer(
      this.program.ts,
      componentIR,
    );

    await componentTransformer.transform(
      transformedFile,
      this.compiler.context,
    );
    await propsTransformer.transform(transformedFile, this.compiler.context);

    this.componentIRBuilder.registerComponent(componentIR);

    this.sourceFileFactory.registerTransformedFile(
      transformedFile,
      sourceFile.fileName,
    );

    return transformedFile;
  }
}
