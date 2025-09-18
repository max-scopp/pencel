import type ts from "typescript";
import { ComponentFileTransformer } from "../transformers/component-file-transformer.ts";
import type { PencelContext } from "../types/compiler-types.ts";

/**
 * Converts a source pencil component to a transformed pencil component.
 *
 * @deprecated Use ComponentFileTransformer class instead
 */
export async function transformComponentFile(
  program: ts.Program,
  sourceFile: ts.SourceFile,
  ctx: PencelContext,
): Promise<ts.SourceFile | null> {
  // Use new class-based approach
  const transformer = new ComponentFileTransformer(program);
  return transformer.transform(sourceFile, ctx);
}
