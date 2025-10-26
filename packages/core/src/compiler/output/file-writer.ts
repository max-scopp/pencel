import { writeFile } from "node:fs/promises";
import { relative } from "node:path";
import { createLog } from "@pencel/utils";
import { Config } from "../config.ts";
import { inject } from "../core/container.ts";
import { Plugins } from "../core/plugin.ts";
import { IRIndex } from "../ir/ref.ts";

const log = createLog("FileWriter");

export class FileWriter {
  readonly #config = inject(Config);
  readonly #plugins = inject(Plugins);
  readonly #iri = inject(IRIndex);

  async writeIr(): Promise<void> {
    const irPath = "ir.json";
    await writeFile(
      irPath,
      JSON.stringify(this.#iri.allByKind("Component"), null, 2),
    );
    log(`Wrote IR to ${relative(this.#config.cwd, irPath)}`);
  }

  async writeEverything(): Promise<void> {
    await this.writeIr();
    await this.writeAllFiles();
    await this.#plugins.write();
  }

  async writeAllFiles(): Promise<void> {
    // perf.start("file-write");
    // const rendered = await this.#sourcefiles.printAllFiles();
    // let progress = 1;
    // for (const [outputFilePath, contents] of rendered) {
    //   await mkdir(dirname(outputFilePath), { recursive: true });
    //   await writeFile(outputFilePath, contents);
    //   progress++;
    //   percentage(progress / rendered.size, {
    //     prefix: "Writing",
    //   });
    // }
    // perf.end("file-write");
  }

  async writeFile(filePath: string): Promise<void> {
    // perf.start("file-write");
    // // Use Pencel registry for import rewriting which handles transformed components properly
    // this.#sourcefiles.rewriteTransformedFileImports();
    // const rendered = await this.#sourcefiles.printFile(filePath);
    // if (rendered) {
    //   const [outputFilePath, contents] = rendered;
    //   const goalPath = resolve(this.#context.cwd, outputFilePath);
    //   await mkdir(dirname(goalPath), { recursive: true });
    //   await writeFile(goalPath, contents);
    // }
    // perf.end("file-write");
  }
}
