import { percentage, throwError } from "@pencel/utils";
import type ts from "typescript";
import { CompilerContext } from "../core/compiler-context.ts";
import { inject } from "../core/container.ts";
import { Program } from "../core/program.ts";
import { ComponentDeclarations } from "../factories/component-declarations.ts";
import { IR } from "../ir/ir.ts";
import { FileProcessor } from "../processors/file-processor.ts";
import { omitPreviousArtifacts } from "../utils/omitPreviousArtifacts.ts";
import { perf } from "../utils/perf.ts";

export class ProjectProcessor {
  readonly program: Program = inject(Program);
  readonly context: CompilerContext = inject(CompilerContext);
  readonly fileProcessor: FileProcessor = inject(FileProcessor);
  readonly componentDeclarations: ComponentDeclarations = inject(
    ComponentDeclarations,
  );
  readonly ir: IR = inject(IR);

  async processFilesInProject(): Promise<Map<string, ts.SourceFile>> {
    perf.start("transform");

    const newComponentsMap = new Map<string, ts.SourceFile>();
    const rootFileNames = this.program.ts
      .getRootFileNames()
      .filter(omitPreviousArtifacts(this.program.ts));

    let completed = 0;

    for (const filePath of rootFileNames) {
      const newComponentFile = await this.fileProcessor.process(
        this.program.ts.getSourceFile(filePath) ??
          throwError("Cannot find source file"),
      );

      completed++;
      percentage(completed / rootFileNames.length, {
        prefix: "Transforming",
      });

      if (newComponentFile) {
        newComponentsMap.set(filePath, newComponentFile);
      }
    }

    perf.end("transform");
    return newComponentsMap;
  }
}
