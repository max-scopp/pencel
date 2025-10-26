import { readFileSync } from "node:fs";
import { throwError } from "@pencel/utils";
import ts from "typescript";
import { inject } from "./container.ts";
import { Program } from "./program.ts";

export class SourceFiles {
  readonly program: Program = inject(Program);

  #generatedFiles = new Map<string, ts.SourceFile>();

  #sourceFiles = new Map<string, ts.SourceFile>();

  /**
   * Loads source files from disk based on file paths discovered by Program
   * Should be called after Program.discover() and re-called on file changes
   */
  async loadSource(): Promise<void> {
    for (const filePath of this.program.filePaths) {
      const source = readFileSync(filePath, "utf-8");
      const sourceFile = ts.createSourceFile(
        filePath,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      this.#sourceFiles.set(filePath, sourceFile);
    }
  }

  /**
   * Clears all generated files and resets the generated files map
   * Should be called at the start of each compilation pass
   */
  clearGenerated(): void {
    this.#generatedFiles.clear();
  }

  getAll(): Map<string, ts.SourceFile> {
    const result = new Map<string, ts.SourceFile>();

    for (const [filePath, sourceFile] of this.#sourceFiles) {
      result.set(filePath, sourceFile);
    }

    for (const [filePath, sourceFile] of this.#generatedFiles) {
      result.set(filePath, sourceFile);
    }

    return result;
  }

  getSourceFile(filePath: string): ts.SourceFile {
    return (
      this.#sourceFiles.get(filePath) ??
      this.#generatedFiles.get(filePath) ??
      throwError(`Source file not found: ${filePath}`)
    );
  }

  newFile(fileName: string): ts.SourceFile {
    const sourceFile = ts.createSourceFile(
      fileName,
      "",
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    // Automatically register generated files so they're tracked and cleaned up
    this.#generatedFiles.set(fileName, sourceFile);
    return sourceFile;
  }
}
