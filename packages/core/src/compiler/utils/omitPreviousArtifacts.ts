import type ts from "typescript";
import { isPencelGeneratedFile } from "./marker.ts";

export function omitPreviousArtifacts(program: ts.Program) {
  return (filePath: string): boolean => {
    const sourceFile = program.getSourceFile(filePath);

    if (!sourceFile) {
      return false;
    }

    return isPencelGeneratedFile(sourceFile) === false;
  };
}
