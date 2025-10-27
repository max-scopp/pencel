import { basename } from "node:path";
import ts from "typescript";
import { Config } from "../config.ts";
import { formatWithBiome } from "../utils/biome-formatter.ts";
import { createPencelMarker } from "../utils/marker.ts";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";

export class SourcePrinter {
  readonly #config = inject(Config);

  /**
   * Prints a single file with Pencel marker
   */
  async printFile(sourceFile: ts.SourceFile): Promise<string> {
    const fname = basename(sourceFile.fileName);
    perf.start(`print:${fname}`);

    const marker = createPencelMarker(sourceFile);
    const printer = ts.createPrinter({ removeComments: false });
    let printed = printer.printFile(sourceFile);

    if (marker) {
      printed = `// ${marker}\n${printed}`;
    }

    // TODO: Make formatters part of the plugin system
    printed = await formatWithBiome(
      printed,
      sourceFile.fileName,
      this.#config.cwd,
    );

    perf.end(`print:${fname}`);
    return printed;
  }

  async printFiles(sourceFiles: ts.SourceFile[]): Promise<Map<string, string>> {
    perf.start("print-files");
    const result = new Map<string, string>();

    for (const sourceFile of sourceFiles) {
      result.set(sourceFile.fileName, await this.printFile(sourceFile));
    }

    perf.end("print-files");
    return result;
  }
}
