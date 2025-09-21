import { percentage } from "@pencel/utils";
import { mkdir, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { CompilerContext } from "../core/compiler-context.ts";
import { inject } from "../core/container.ts";
import { SourceFileFactory } from "../factories/source-file-factory.ts";
import { perf } from "../utils/perf.ts";

export class FileWriter {
  readonly #context = inject(CompilerContext);
  readonly #pencilRegistry = inject(SourceFileFactory);

  async writeAllFiles(): Promise<void> {
    perf.start("file-write");

    let progress = 1;

    // Use Pencel registry for import rewriting which handles transformed components properly
    this.#pencilRegistry.rewriteTransformedFileImports();
    const rendered = this.#pencilRegistry.printAllFiles();

    await Promise.all(
      Array.from(rendered).map(
        async ([outputFilePath, contents], _idx, all) => {
          const goalPath = resolve(this.#context.cwd, outputFilePath);
          await mkdir(dirname(goalPath), { recursive: true });

          progress++;
          percentage(progress / all.length, {
            prefix: "Writing",
          });

          return writeFile(goalPath, await contents);
        },
      ),
    );

    perf.end("file-write");
  }

  async writeFile(filePath: string): Promise<void> {
    perf.start("file-write");

    // Use Pencel registry for import rewriting which handles transformed components properly
    this.#pencilRegistry.rewriteTransformedFileImports();
    const rendered = this.#pencilRegistry.printFile(filePath);

    if (rendered) {
      const [outputFilePath, contents] = rendered;
      const goalPath = resolve(this.#context.cwd, outputFilePath);
      await mkdir(dirname(goalPath), { recursive: true });
      await writeFile(goalPath, await contents);
    }

    perf.end("file-write");
  }
}
