import { createLog, percentage } from "@pencel/utils";
import { mkdir, writeFile } from "fs/promises";
import { dirname, relative, resolve } from "path";
import { CompilerContext } from "../core/compiler-context.ts";
import { inject } from "../core/container.ts";
import { SourceFiles } from "../factories/source-files.ts";
import { IR } from "../ir/ir.ts";
import { perf } from "../utils/perf.ts";

const log = createLog("FileWriter");

export class FileWriter {
  readonly #context = inject(CompilerContext);
  readonly #ir = inject(IR);
  readonly #sourcefiles = inject(SourceFiles);

  async writeIr(): Promise<void> {
    const irPath = this.#sourcefiles.computeSrcPath("ir.json");
    await writeFile(irPath, JSON.stringify(this.#ir.components, null, 2));
    log(`Wrote IR to ${relative(this.#context.cwd, irPath)}`);
  }

  async writeEverything(): Promise<void> {
    await this.writeIr();
    await this.writeAllFiles();
  }

  async writeAllFiles(): Promise<void> {
    perf.start("import-rewrite");
    this.#sourcefiles.rewriteTransformedFileImports();
    perf.end("import-rewrite");

    perf.start("file-write");
    const rendered = await this.#sourcefiles.printAllFiles();

    let progress = 1;
    for (const [outputFilePath, contents] of rendered) {
      await mkdir(dirname(outputFilePath), { recursive: true });

      progress++;

      percentage(progress / rendered.size, {
        prefix: "Writing",
      });

      writeFile(outputFilePath, contents);
    }

    perf.end("file-write");
  }

  async writeFile(filePath: string): Promise<void> {
    perf.start("file-write");

    // Use Pencel registry for import rewriting which handles transformed components properly
    this.#sourcefiles.rewriteTransformedFileImports();
    const rendered = this.#sourcefiles.printFile(filePath);

    if (rendered) {
      const [outputFilePath, contents] = rendered;
      const goalPath = resolve(this.#context.cwd, outputFilePath);
      await mkdir(dirname(goalPath), { recursive: true });
      await writeFile(goalPath, await contents);
    }

    perf.end("file-write");
  }
}
