import type { SourceFile } from "typescript";
import type { RenamableSourceFile } from "../compiler/core/source-files.ts";

/**
 * Extract the output path from a SourceFile, preferring outputFileName over fileName.
 * Safely casts to RenamableSourceFile and returns outputFileName if set, otherwise fileName.
 */
export function getOutputPath(sourceFile: SourceFile): string {
  const renamable = sourceFile as RenamableSourceFile;
  return renamable.outputFileName ?? sourceFile.fileName;
}
