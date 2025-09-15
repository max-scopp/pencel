import type ts from "typescript";
import type { PencelContext } from "../types/compiler-types.ts";

export function omitPreviousArtifacts(program: ts.Program, ctx: PencelContext) {
  return (filePath: string): boolean => {
    const sourceFile = program.getSourceFile(filePath);

    return (
      ctx.config.output.mode === "aside" &&
      ctx.config.output.replace[0].test(filePath)
    );
  };
}
