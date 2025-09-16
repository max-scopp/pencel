import type ts from "typescript";
import type { PencelContext } from "../types/compiler-types.ts";
import { isPencelGeneratedFile } from "./marker.ts";

export function omitPreviousArtifacts(program: ts.Program, ctx: PencelContext) {
  return (filePath: string): boolean => {
    const sourceFile = program.getSourceFile(filePath);

    if (!sourceFile) {
      return false;
    }

    return isPencelGeneratedFile(sourceFile) === false;
  };
}
