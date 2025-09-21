import { createLog } from "@pencel/utils";
import type { SourceFile } from "typescript";
import { ProjectProcessor } from "../codegen/file-transformer.ts";
import { Config } from "../config/config.ts";
import { SourceFiles } from "../factories/source-files.ts";
import { IR } from "../ir/ir.ts";
import { FileWriter } from "../output/file-writer.ts";
import { FileProcessor } from "../processors/file-processor.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";
import { inject } from "./container.ts";
import { Program } from "./program.ts";

const log = createLog("Transform");

export class Compiler {
  readonly #config = inject(Config);
  readonly #fileWriter = inject(FileWriter);
  readonly #fileProcessor: FileProcessor = inject(FileProcessor);
  readonly #projectProcessor: ProjectProcessor = inject(ProjectProcessor);
  readonly #sourceFileRegistry = inject(SourceFiles);

  readonly #program: Program = inject(Program);

  readonly #ir: IR = inject(IR);

  get context(): PencelContext {
    return {
      cwd: this.#config.cwd,
      config: this.#config.config,
    };
  }

  async transformFile(filePath: string): Promise<void> {
    if (!this.#program || !this.context || !this.#sourceFileRegistry) {
      throw new Error("Compiler not set up. Call setup() first.");
    }

    const sourceFile = this.#program.ts.getSourceFile(filePath);
    if (!sourceFile) {
      log(`File not found in program: ${filePath}`);
      return;
    }

    // Check if this is one of our own generated files to avoid infinite loops
    if (isPencelGeneratedFile(sourceFile)) {
      log(`Skipping generated file: ${filePath}`);
      return;
    }

    log(`Transforming single file: ${filePath}`);

    const newComponentFile = await this.#fileProcessor.process(sourceFile);

    if (newComponentFile) {
      // Create and register the transformed file
      const sourceFileFactory = new SourceFiles();
      const transformedFile =
        sourceFileFactory.createTransformedFile(sourceFile);
      this.#sourceFileRegistry.registerTransformedFile(
        transformedFile,
        filePath,
      );
    }
  }

  async transform(): Promise<Map<string, SourceFile>> {
    const result = await this.#projectProcessor.processFilesInProject();

    await this.#fileWriter.writeEverything();

    return result;
  }
}
