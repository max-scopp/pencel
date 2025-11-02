import ts from "typescript";
import { getOutputPath } from "../../ts-utils/getOutputPath.ts";
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
    const marker = createPencelMarker(sourceFile);
    const printer = ts.createPrinter({ removeComments: false });
    let printed = printer.printFile(sourceFile);

    if (marker) {
      printed = `// ${marker}\n${printed}`;
    }

    // TODO: Make formatters part of the plugin system
    const outputPath = getOutputPath(sourceFile);
    printed = await formatWithBiome(printed, outputPath, this.#config.cwd);

    return printed;
  }

  async printFiles(sourceFiles: ts.SourceFile[]): Promise<Map<string, string>> {
    perf.start("print-files");
    const result = new Map<string, string>();

    for (const sourceFile of sourceFiles) {
      const outputPath = getOutputPath(sourceFile);
      result.set(outputPath, await this.printFile(sourceFile));
    }

    perf.end("print-files");
    return result;
  }
}
