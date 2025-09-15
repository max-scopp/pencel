import { throwError } from "@pencel/utils";
import type { PencilConfig } from "dist/index.js";
import type { ProgramBuilder } from "ts-flattered";
import type ts from "typescript";
import { compilerTree } from "../core/compiler.ts";
import { transformComponentFile } from "./transform-component-file.ts";

export async function transformComponents(
  program: ts.Program & ProgramBuilder,
  config: PencilConfig,
): Promise<Map<string, ts.SourceFile>> {
  const newComponentsMap = new Map<string, ts.SourceFile>();
  const rootFileNames = program.getRootFileNames();

  compilerTree.start(`transform`);

  await Promise.all(
    rootFileNames.map(async (filePath) => {
      const newComponentFile = await transformComponentFile(
        program.getSourceFile(filePath) ??
          throwError("Cannot find source file"),
        config,
      );

      if (newComponentFile) {
        newComponentsMap.set(filePath, newComponentFile);
      }
    }),
  );

  compilerTree.end(`transform`);

  return newComponentsMap;
}
