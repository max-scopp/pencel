import { createHash } from "crypto";
import type ts from "typescript";

export function sourceFileSha256(sourceFile: ts.SourceFile): string {
  // NOTE: Using `sourceFile.text` instead of `getFullText()` to avoid including BOM and leading/trailing whitespace
  return createHash("sha256").update(sourceFile.text).digest("hex");
}
