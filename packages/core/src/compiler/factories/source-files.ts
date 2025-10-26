import { basename } from "node:path";
import type { SourceFile } from "ts-flattered";
import { Config } from "../config.ts";
import { inject } from "../core/container.ts";
import { Program } from "../core/program.ts";
import { createPencelMarker } from "../utils/marker.ts";
import { perf } from "../utils/perf.ts";

export class SourceFiles {
  readonly program: Program = inject(Program);
  readonly config: Config = inject(Config);

  readonly #files = new Map<string, SourceFile>();

  /**
   * Register a regular file (passthrough from base registry)
   */
  register(sourceFile: SourceFile, filePath?: string): void {
    const fileName = sourceFile.getFileName();
    this.#files.set(filePath || fileName, sourceFile);
  }

  /**
   * Get all files from the registry
   */
  getAll(): Map<string, SourceFile> {
    return new Map(this.#files);
  }

  /**
   * Write all files
   */
  async printAllFiles(): Promise<Map<string, string>> {
    perf.start("print-all");
    const result = new Map<string, string>();

    for (const filePath of this.#files.keys()) {
      result.set(filePath, await this.printFile(filePath));
    }

    perf.end("print-all");
    return result;
  }

  async printFile(filePath: string): Promise<string> {
    const fname = basename(filePath);
    perf.start(`print:${fname}`);

    const sourceFile = this.#files.get(filePath);

    if (!sourceFile) {
      throw new Error(`File not found in registry: ${filePath}`);
    }

    // Get the underlying TypeScript source file to create the marker
    const tsSourceFile = this.program.ts.getSourceFile(filePath);
    const marker = tsSourceFile ? createPencelMarker(tsSourceFile) : "";

    // Print with the marker prepended as a comment
    const printed = await sourceFile.print({
      biome: {
        projectDir: this.config.cwd,
      },
    });

    const markerComment = marker ? `// ${marker}\n` : "";

    perf.end(`print:${fname}`);
    return markerComment + printed;
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.#files.clear();
  }
}
