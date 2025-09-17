import { percentage, throwError } from "@pencel/utils";
import type { ProgramBuilder } from "ts-flattered";
import type ts from "typescript";
import type { PencelContext } from "../types/compiler-types.ts";
import { omitPreviousArtifacts } from "../utils/omitPreviousArtifacts.ts";
import { transformComponentFile } from "./transform-component-file.ts";

export async function transformComponents(
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
      const newComponentFile = await transformComponentFile(
        program,
        program.getSourceFile(filePath) ??
          throwError("Cannot find source file"),
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
