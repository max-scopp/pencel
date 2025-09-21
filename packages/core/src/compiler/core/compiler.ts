import { createLog } from "@pencel/utils";
import type { SourceFile } from "typescript";
import { FileTransformer } from "../codegen/file-transformer.ts";
import { Config } from "../config/config.ts";
import { SourceFileFactory } from "../factories/source-file-factory.ts";
import { IR } from "../ir/ir.ts";
import { FileWriter } from "../output/file-writer.ts";
import type {
  PencelContext,
  TransformResults,
} from "../types/compiler-types.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";
import { Program } from "./program.ts";

const log = createLog("Transform");

export class Compiler {
  readonly #config = inject(Config);
  readonly #fileWriter = inject(FileWriter);
  readonly #fileTransformer: FileTransformer = inject(FileTransformer);
  readonly #sourceFileRegistry = inject(SourceFileFactory);

  readonly #program: Program = inject(Program);

  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: <explanation>
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

    const newComponentFile =
      await this.#fileTransformer.transformFile(sourceFile);

    if (newComponentFile) {
      // Create and register the transformed file
      const sourceFileFactory = new SourceFileFactory();
      const transformedFile =
        sourceFileFactory.createTransformedFile(sourceFile);
      this.#sourceFileRegistry.registerTransformedFile(
        transformedFile,
        filePath,
      );
    }
  }

  async transform(): Promise<Map<string, SourceFile>> {
    const result = await this.#fileTransformer.transform(this.#program.ts);
    await this.#fileWriter.writeAllFiles();

    return result;
  }
}
