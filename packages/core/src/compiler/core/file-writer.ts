import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { percentage } from "@pencel/utils";
import { getOutputPath } from "../../ts-utils/getOutputPath.ts";
import { inject } from "../core/container.ts";
import { IRRI } from "../ir/irri.ts";
import { SourcePreprocessor } from "../preprocessing/source-preprocessor.ts";
import { perf } from "../utils/perf.ts";
import { Plugins } from "./plugin.ts";
import { SourceFiles } from "./source-files.ts";
import { SourcePrinter } from "./source-printer.ts";

export class FileWriter {
  readonly #iri = inject(IRRI);
  readonly #sourceFiles = inject(SourceFiles);
  readonly #sourcePrinter = inject(SourcePrinter);
  readonly #sourcePreprocessor = inject(SourcePreprocessor);
  readonly #plugins = inject(Plugins);

  async writeEverything(): Promise<void> {
    const fileIRs = this.#iri.allByKind("File");
    const irs = this.#iri.implode(fileIRs);

    await this.#plugins.handle({
      hook: "generate",
      irs,
    });

    await this.writeAllFiles();
  }

  async writeAllFiles(): Promise<void> {
    perf.start("file-write");
    const files = this.#sourceFiles.getAll();

    let progress = 1;
    for (const sourceFile of files.values()) {
      const outputFilePath = getOutputPath(sourceFile);
      perf.start(`pack:${basename(outputFilePath)}`);

      perf.start("preprocess");
      const preference = this.#sourceFiles.getImportPreference(sourceFile.fileName);
      const preprocessed = this.#sourcePreprocessor.process(sourceFile, preference);
      perf.end("preprocess");

      await mkdir(dirname(outputFilePath), { recursive: true });
      perf.start("print");
      const printed = await this.#sourcePrinter.printFile(preprocessed);
      perf.end("print");
      perf.start("write");
      await writeFile(outputFilePath, printed);
      perf.end("write");
      perf.end(`pack:${basename(outputFilePath)}`);

      progress++;
      percentage(progress / files.size, {
        prefix: "Writing",
      });
    }
    perf.end("file-write");
  }
}
