import { percentage, throwError } from "@pencel/utils";
import type { ProgramBuilder } from "ts-flattered";
import type ts from "typescript";
import { inject } from "../core/container.ts";
import { ComponentFileTransformer } from "../transformers/component-file-transformer.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { omitPreviousArtifacts } from "../utils/omitPreviousArtifacts.ts";

export class ComponentsTransformer {
  componentsFileTransformer: ComponentFileTransformer = inject(
    ComponentFileTransformer,
  );

  async transform(
    program: ts.Program & ProgramBuilder,
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
        const newComponentFile = await this.componentsFileTransformer.transform(
          program.getSourceFile(filePath) ??
            throwError("Cannot find source file"),
          program,
          ctx,
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
}
