import { basename } from "node:path";
import type { SourceFile } from "typescript";
import { Config } from "../config.ts";
import type { FileIR } from "../ir/file.ts";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";
import { FileProcessor } from "./file-processor.ts";
import { FileWriter } from "./file-writer.ts";
import { Plugins } from "./plugin.ts";
import { Program } from "./program.ts";
import { SourceFiles } from "./source-files.ts";

export class Compiler {
  readonly #config = inject(Config);
  readonly #program = inject(Program);
  readonly #plugins = inject(Plugins);
  readonly #sourceFiles = inject(SourceFiles);
  readonly #fileProcessor = inject(FileProcessor);
  readonly #fileWriter = inject(FileWriter);

  async init(configFile?: string): Promise<void> {
    perf.start("initialize");

    await this.#config.load(configFile);
    await this.#plugins.initialize();

    perf.end("initialize");
  }

  async compile(): Promise<Map<string, FileIR>> {
    perf.start("compile");

    await this.#buildGraph();
    const result = await this.processAllFiles();

    perf.end("compile");
    return result;
  }

  /**
   * Incremental compile: reloads graph, then transforms only specified files
   * // TODO: writing files missing
   */
  async compileChangedFiles(
    changedFiles: string[],
  ): Promise<Map<string, FileIR>> {
    await this.#buildGraph();
    return this.processFiles(changedFiles);
  }

  async #buildGraph(): Promise<void> {
    perf.start("build-graph");
    await this.#program.discover();
    await this.#sourceFiles.loadSource();
    // Clear generated files from previous pass so plugins can repopulate
    this.#sourceFiles.clearGenerated();
    perf.end("build-graph");
  }

  async processFile(
    sourceFile: SourceFile,
  ): Promise<FileIR | null | undefined> {
    perf.start(`transform:${basename(sourceFile.fileName)}`);

    const fileIrr = await this.#fileProcessor.process(sourceFile);

    perf.end(`transform:${basename(sourceFile.fileName)}`);

    return fileIrr?.ir;
  }

  async processAllFiles(): Promise<Map<string, FileIR>> {
    const sourceFiles = this.#sourceFiles.getAll();
    const result = new Map<string, FileIR>();

    for (const sf of sourceFiles.values()) {
      const ir = await this.processFile(sf);

      if (ir) {
        result.set(sf.fileName, ir);
      }
    }

    await this.#fileWriter.writeEverything();

    perf.log();

    return result;
  }

  async processFiles(filePaths: string[]): Promise<Map<string, FileIR>> {
    const allSourceFiles = this.#sourceFiles.getAll();
    const result = new Map<string, FileIR>();

    for (const path of filePaths) {
      const sf = allSourceFiles.get(path);
      if (sf) {
        const ir = await this.processFile(sf);

        if (ir) {
          result.set(sf.fileName, ir);
        }
      }
    }

    await this.#fileWriter.writeEverything();

    perf.log();

    return result;
  }
}
