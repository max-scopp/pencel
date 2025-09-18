import { fileFromString, type SourceFile } from "ts-flattered";
import type ts from "typescript";
import { getPencilRegistry } from "../core/program-registry.ts";
import { createPencelMarker } from "../utils/marker.ts";

export class SourceFileFactory {
  createTransformedFile(sourceFile: ts.SourceFile): SourceFile {
    const newSourceFile = fileFromString(
      sourceFile.fileName,
      sourceFile.getFullText(),
      sourceFile.languageVersion,
      getPencilRegistry().getBaseRegistry(),
      false, // Don't auto-register, we'll register it manually
    );

    newSourceFile.prependBanner(createPencelMarker(sourceFile), "line");

    return newSourceFile;
  }

  registerTransformedFile(
    transformedFile: SourceFile,
    originalFileName: string,
  ): void {
    const pencilRegistry = getPencilRegistry();
    pencilRegistry.registerTransformedFile(transformedFile, originalFileName);
  }
}
