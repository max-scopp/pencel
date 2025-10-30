import { readFileSync } from "node:fs";
import { join } from "node:path";
import { throwError } from "@pencel/utils";
import {
  createSourceFile,
  factory,
  ScriptKind,
  ScriptTarget,
  type SourceFile,
  type Statement,
} from "typescript";
import { Config } from "../config.ts";
import { inject } from "./container.ts";
import { Program } from "./program.ts";

export interface RenamableSourceFile extends SourceFile {
  outputFileName?: string;
}

export class SourceFiles {
  #program = inject(Program);
  #config = inject(Config);

  #generatedFiles = new Map<string, SourceFile>();

  #sourceFiles = new Map<string, RenamableSourceFile>();

  /**
   * Loads source files from disk based on file paths discovered by Program
   * Should be called after Program.discover() and re-called on file changes
   */
  async loadSource(): Promise<void> {
    for (const filePath of this.#program.filePaths) {
      const source = readFileSync(filePath, "utf-8");
      const sourceFile = createSourceFile(
        filePath,
        source,
        ScriptTarget.Latest,
        true,
        ScriptKind.TSX,
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

  getAll(): Map<string, RenamableSourceFile> {
    const result = new Map<string, RenamableSourceFile>();

    for (const [filePath, sourceFile] of this.#sourceFiles) {
      result.set(filePath, sourceFile);
    }

    for (const [filePath, sourceFile] of this.#generatedFiles) {
      result.set(filePath, sourceFile);
    }

    return result;
  }

  getSourceFile(filePath: string): SourceFile {
    return (
      this.#sourceFiles.get(filePath) ??
      this.#generatedFiles.get(filePath) ??
      throwError(`Source file not found: ${filePath}`)
    );
  }

  getOutputPath(sourceFile: SourceFile): string {
    const renamable = sourceFile as RenamableSourceFile;
    return renamable.outputFileName ?? sourceFile.fileName;
  }

  newFile(fileName: string, statements?: Statement[]): SourceFile {
    // Resolve fileName relative to baseDir and cwd
    const resolvedFileName = join(
      this.#config.cwd,
      this.#config.user.baseDir,
      fileName,
    );

    // Create empty source file first to get proper initialization
    const sourceFile = createSourceFile(
      resolvedFileName,
      "",
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );

    // Automatically register generated files so they're tracked and cleaned up
    this.#generatedFiles.set(resolvedFileName, sourceFile);

    if (statements) {
      this.setStatements(sourceFile, statements);
    }

    return sourceFile;
  }

  /**
   * Updates or resets a SourceFile's statements
   * Returns a new SourceFile with updated statements, replacing it in the internal maps
   */
  setStatements(
    sourceFile: SourceFile,
    statements: readonly Statement[],
  ): SourceFile {
    const updated = factory.updateSourceFile(sourceFile, statements);

    // Update the file in the appropriate map
    const fileName = sourceFile.fileName;
    if (this.#sourceFiles.has(fileName)) {
      this.#sourceFiles.set(fileName, updated);
    } else if (this.#generatedFiles.has(fileName)) {
      this.#generatedFiles.set(fileName, updated);
    } else {
      throw new Error(`Source file not found in either map: ${fileName}`);
    }

    return updated;
  }
}
