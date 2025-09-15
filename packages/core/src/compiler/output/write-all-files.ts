import { log } from "console";
import { mkdir, writeFile } from "fs/promises";
import { basename, dirname, resolve } from "path";
import { print } from "ts-flattered";
import type ts from "typescript";
import type { PencelContext } from "../types/compiler-types.ts";

export async function writeAllFiles(
  newSourceFiles: Map<string, ts.SourceFile>,
  ctx: PencelContext,
): Promise<void> {
  const generateTargetPath = (sf: ts.SourceFile) => {
    switch (ctx.config.output.mode) {
      case "aside": {
        const absDir = dirname(resolve(ctx.cwd, sf.fileName));
        return resolve(
          absDir,
          basename(sf.fileName).replace(...ctx.config.output.replace),
        );
      }
      case "folder": {
        const absDir = dirname(resolve(ctx.cwd, ctx.config.output.path));
        return resolve(absDir, sf.fileName);
      }
    }
  };

  await Promise.all(
    Array.from(newSourceFiles.values()).map(async (sf) => {
      const writePath = generateTargetPath(sf);
      log(`Writing file: ${writePath}`);

      await mkdir(dirname(writePath), { recursive: true });

      const printed = await print(sf, { biome: { projectDir: ctx.cwd } });

      return writeFile(writePath, printed);
    }),
  );
}
