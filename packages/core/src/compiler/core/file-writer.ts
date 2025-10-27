import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { percentage } from "@pencel/utils";
import { inject } from "../core/container.ts";
import { IRRI } from "../ir/irri.ts";
import { perf } from "../utils/perf.ts";
import { Plugins } from "./plugin.ts";
import { SourceFiles } from "./source-files.ts";
import { SourcePrinter } from "./source-printer.ts";

export class FileWriter {
  readonly #iri = inject(IRRI);
  readonly #sourceFiles = inject(SourceFiles);
  readonly #sourcePrinter = inject(SourcePrinter);
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
    const files = await this.#sourceFiles.getAll();
    let progress = 1;
    for (const contents of files) {
      const outputFilePath = contents.outputFileName ?? contents.fileName;

      await mkdir(dirname(outputFilePath), { recursive: true });
      const printed = await this.#sourcePrinter.printFile(contents);
      await writeFile(outputFilePath, printed);
      progress++;
      percentage(progress / files.length, {
        prefix: "Writing",
      });
    }
    perf.end("file-write");
  }
}
