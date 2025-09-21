import { percentage, throwError } from "@pencel/utils";
import type ts from "typescript";
import { CompilerContext } from "../core/compiler-context.ts";
import { inject } from "../core/container.ts";
import { Program } from "../core/program.ts";
import { ComponentDeclarations } from "../factories/component-declarations.ts";
import { SourceFileFactory } from "../factories/source-file-factory.ts";
import { ComponentIR } from "../ir/component-ir.ts";
import { IR } from "../ir/ir.ts";
import { FileProcessor } from "../processors/file-processor.ts";
import { ComponentDecoratorTransformer } from "../transformers/component-decorator-transformer.ts";
import { PropsDecoratorTransformer } from "../transformers/props-decorator-transformer.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { omitPreviousArtifacts } from "../utils/omitPreviousArtifacts.ts";

export class FileTransformer {
  readonly program: Program = inject(Program);
  readonly context: CompilerContext = inject(CompilerContext);
  readonly fileProcessor: FileProcessor = inject(FileProcessor);
  readonly sourceFileFactory: SourceFileFactory = inject(SourceFileFactory);
  readonly componentDeclarations: ComponentDeclarations = inject(
    ComponentDeclarations,
  );
  readonly ir: IR = inject(IR);

  async transform(
    program: ts.Program,
    ctx: PencelContext,
  ): Promise<Map<string, ts.SourceFile>> {
    const newComponentsMap = new Map<string, ts.SourceFile>();
    const rootFileNames = program
      .getRootFileNames()
      .filter(omitPreviousArtifacts(program, ctx));

    let completed = 0;
    const total = rootFileNames.length;

    await Promise.all(
      rootFileNames.map(async (filePath) => {
        const newComponentFile = await this.transformFile(
          program.getSourceFile(filePath) ??
            throwError("Cannot find source file"),
        );

        completed++;
        percentage(completed / total, {
          prefix: "Transforming",
        });

        if (newComponentFile) {
          newComponentsMap.set(filePath, newComponentFile);
        }
      }),
    );

    return newComponentsMap;
  }

  async transformFile(
    sourceFile: ts.SourceFile,
  ): Promise<ts.SourceFile | null> {
    if (!this.fileProcessor.shouldProcess(sourceFile, this.context)) {
      return null;
    }

    const transformedFile =
      this.sourceFileFactory.createTransformedFile(sourceFile);

    const componentIR = new ComponentIR(transformedFile);

    const componentTransformer = new ComponentDecoratorTransformer(componentIR);
    const propsTransformer = new PropsDecoratorTransformer(
      this.program.ts,
      componentIR,
    );

    await componentTransformer.transform(transformedFile, this.context);
    await propsTransformer.transform(transformedFile, this.context);

    this.ir.components.push(componentIR);

    this.sourceFileFactory.registerTransformedFile(
      transformedFile,
      sourceFile.fileName,
    );

    return transformedFile;
  }
}
