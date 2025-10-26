import { createLog } from "@pencel/utils";
import type { SourceFile } from "typescript";
import { Config } from "../config.ts";
import type { FileIR } from "../ir/file.ts";
import { FileWriter } from "../output/file-writer.ts";
import { FileProcessor } from "../processors/file-processor.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";
import { Plugins } from "./plugin.ts";
import { Program } from "./program.ts";

const log = createLog("Transform");

export class Compiler {
  readonly #config = inject(Config);
  readonly #fileWriter = inject(FileWriter);
  readonly #program = inject(Program);
  readonly #fileProcessor = inject(FileProcessor);

  get context(): PencelContext {
    return {
      cwd: this.#config.cwd,
      config: this.#config.user,
    };
  }

  async transformFile(
    sourceFile: SourceFile,
  ): Promise<FileIR | null | undefined> {
    const filePath = sourceFile.fileName;

    if (
      sourceFile.fileName.startsWith("/") ||
      sourceFile.fileName.startsWith("..") ||
      sourceFile.fileName.includes("node_modules") ||
      sourceFile.fileName.match(/\.d\..*$/)
    ) {
      return;
    }

    // Check if this is one of our own generated files to avoid infinite loops
    if (isPencelGeneratedFile(sourceFile)) {
      log(`Skipping generated file: ${filePath}`);
      return;
    }

    log(`Transforming single file: ${filePath}`);

    const fileIr = await this.#fileProcessor.process(sourceFile);

    console.log(fileIr);
    return fileIr;
  }

  async transform(): Promise<Map<string, FileIR>> {
    const sourceFiles = await this.#program.ts.getSourceFiles();
    const result = new Map<string, FileIR>();

    const promises = sourceFiles.map(async (sf) => {
      const ir = await this.transformFile(sf);

      if (ir) {
        result.set(sf.fileName, ir);
      }
    });

    await Promise.all(promises);

    await this.#fileWriter.writeEverything();

    perf.log();

    return result;
  }

  async cleanup(): Promise<void> {
    const plugins = inject(Plugins);
    if (plugins) {
      await plugins.cleanup();
    }
  }
}
