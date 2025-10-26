import { basename } from "node:path";
import { createLog } from "@pencel/utils";
import type { SourceFile } from "typescript";
import { Config } from "../config.ts";
import type { FileIR } from "../ir/file.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";
import { FileProcessor } from "./file-processor.ts";
import { FileWriter } from "./file-writer.ts";
import { Plugins } from "./plugin.ts";
import { Program } from "./program.ts";
import { SourceFiles } from "./source-files.ts";

const log = createLog("Transform");

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
    const result = await this.transformAllFiles();

    perf.end("compile");
    return result;
  }

  /**
   * Incremental compile: reloads graph, then transforms only specified files
   */
  async compileChangedFiles(
    changedFiles: string[],
  ): Promise<Map<string, FileIR>> {
    await this.#buildGraph();
    return this.transformFiles(changedFiles);
  }

  async #buildGraph(): Promise<void> {
    perf.start("build-graph");
    await this.#program.discover();
    await this.#sourceFiles.loadSource();
    // Clear generated files from previous pass so plugins can repopulate
    this.#sourceFiles.clearGenerated();
    perf.end("build-graph");
  }

  async transformFile(
    sourceFile: SourceFile,
  ): Promise<FileIR | null | undefined> {
    perf.start(`transform-${basename(sourceFile.fileName)}`);
    const filePath = sourceFile.fileName;

    if (isPencelGeneratedFile(sourceFile)) {
      log(`Skipping generated file: ${filePath}`);
      return;
    }

    const fileIr = await this.#fileProcessor.process(sourceFile);

    perf.end(`transform-${basename(sourceFile.fileName)}`);

    console.log(fileIr);

    return fileIr;
  }

  async transformAllFiles(): Promise<Map<string, FileIR>> {
    const sourceFiles = this.#sourceFiles.getAll();
    const result = new Map<string, FileIR>();

    for (const sf of sourceFiles.values()) {
      const ir = await this.transformFile(sf);

      if (ir) {
        result.set(sf.fileName, ir);
      }
    }

    await this.#fileWriter.writeEverything();

    perf.log();

    return result;
  }

  async transformFiles(filePaths: string[]): Promise<Map<string, FileIR>> {
    const allSourceFiles = this.#sourceFiles.getAll();
    const result = new Map<string, FileIR>();

    for (const path of filePaths) {
      const sf = allSourceFiles.get(path);
      if (sf) {
        const ir = await this.transformFile(sf);

        if (ir) {
          result.set(sf.fileName, ir);
        }
      }
    }

    if (result.size > 0) {
      await this.#fileWriter.writeEverything();
    }

    perf.log();

    return result;
  }
}
