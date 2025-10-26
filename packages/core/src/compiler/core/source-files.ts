import { throwError } from "@pencel/utils";
import ts from "typescript";
import { inject } from "./container.ts";
import { Program } from "./program.ts";

export class SourceFiles {
  readonly program: Program = inject(Program);

  /**
   * filePath keys are relative to cwd/baseUrl (e.g., "components/my-component.ts")
   */
  #generatedFiles = new Map<string, ts.SourceFile>();

  getAll(): Map<string, ts.SourceFile> {
    const result = new Map<string, ts.SourceFile>();

    for (const sourceFile of this.program.ts.getSourceFiles()) {
      result.set(sourceFile.fileName, sourceFile);
    }

    for (const [filePath, sourceFile] of this.#generatedFiles) {
      result.set(filePath, sourceFile);
    }

    return result;
  }

  getSourceFile(filePath: string): ts.SourceFile {
    return (
      this.#generatedFiles.get(filePath) ??
      throwError(`Source file not found: ${filePath}`)
    );
  }

  newFile(fileName: string): ts.SourceFile {
    return ts.createSourceFile(
      fileName,
      "",
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
  }
}
