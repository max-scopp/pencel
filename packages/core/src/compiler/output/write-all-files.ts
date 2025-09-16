import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { percentage } from "@pencel/utils";
import { print } from "ts-flattered";
import type ts from "typescript";
import type { PencelContext } from "../types/compiler-types.ts";
import { getOutputPathForSource } from "../utils/getOutputPathForSource.ts";

export async function writeAllFiles(
  newSourceFiles: Map<string, ts.SourceFile>,
  ctx: PencelContext,
): Promise<void> {
  let progress = 1;

  await Promise.all(
    Array.from(newSourceFiles.values()).map(async (sf) => {
      const writePath = getOutputPathForSource(sf, ctx);

      await mkdir(dirname(writePath), { recursive: true });

      const printed = await print(sf, { biome: { projectDir: ctx.cwd } });

      progress++;
      percentage(progress / newSourceFiles.size, {
        prefix: "Writing",
      });

      return writeFile(writePath, printed);
    }),
  );
}
