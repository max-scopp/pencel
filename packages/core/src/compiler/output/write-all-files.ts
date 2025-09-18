import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { percentage } from "@pencel/utils";
import { getPencilRegistry } from "../core/program-registry.ts";
import type { PencelContext } from "../types/compiler-types.ts";

export async function writeAllFiles(ctx: PencelContext): Promise<void> {
  let progress = 1;

  const pencilRegistry = getPencilRegistry();

  // Use Pencel registry for import rewriting which handles transformed components properly
  pencilRegistry.rewriteTransformedFileImports();
  const rendered = pencilRegistry.writeAllFiles();

  await Promise.all(
    Array.from(rendered).map(async ([outputFilePath, contents], _idx, all) => {
      const goalPath = resolve(ctx.cwd, outputFilePath);
      await mkdir(dirname(goalPath), { recursive: true });

      progress++;
      percentage(progress / all.length, {
        prefix: "Writing",
      });

      return writeFile(goalPath, await contents);
    }),
  );
}
