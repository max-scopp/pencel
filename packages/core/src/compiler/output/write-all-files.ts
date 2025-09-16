import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { print } from "ts-flattered";
import type ts from "typescript";
import { compilerTree } from "../core/compiler.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { getOutputPathForSource } from "../utils/getOutputPathForSource.ts";

export async function writeAllFiles(
  newSourceFiles: Map<string, ts.SourceFile>,
  ctx: PencelContext,
): Promise<void> {
  await Promise.all(
    Array.from(newSourceFiles.values()).map(async (sf) => {
      const writePath = getOutputPathForSource(sf, ctx);

      await mkdir(dirname(writePath), { recursive: true });

      compilerTree.start(`printing ${basename(sf.fileName)}`);
      const printed = await print(sf, { biome: { projectDir: ctx.cwd } });
      compilerTree.end(`printing ${basename(sf.fileName)}`);

      return writeFile(writePath, printed);
    }),
  );
}
