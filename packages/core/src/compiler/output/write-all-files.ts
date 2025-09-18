import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { percentage } from "@pencel/utils";
import type ts from "typescript";
import { programRegistry } from "../core/program-registry.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { getOutputPathForSource } from "../utils/getOutputPathForSource.ts";

export async function writeAllFiles(
  inProgram: ts.Program,
  newSourceFiles: Map<string, ts.SourceFile>,
  ctx: PencelContext,
): Promise<void> {
  let progress = 1;

  const inCompilerOptions = inProgram.getCompilerOptions();

  // For folder mode, we need to rewrite imports to point to the new output structure
  if (ctx.config.output?.mode === "folder") {
    // The registry contains files with relative paths like "src/components/tabs/tabs.tsx"
    // We need to move them from the current working directory to the output directory
    const base = ctx.cwd; // Current working directory base
    const outBase = resolve(ctx.cwd, ctx.config.output.path); // Output directory

    programRegistry.rewriteAllRelativeImports(base, outBase);
    const rendered = programRegistry.writeAllFiles();

    await Promise.all(
      Array.from(rendered).map(
        async ([originalFilePath, contents], _idx, all) => {
          // Find the corresponding source file to get the correct output path
          const sourceFile = Array.from(newSourceFiles.values()).find(
            (sf) =>
              sf.fileName === originalFilePath ||
              sf.fileName.endsWith(originalFilePath),
          );

          const goalPath = sourceFile
            ? getOutputPathForSource(sourceFile, ctx)
            : resolve(ctx.cwd, originalFilePath);

          await mkdir(dirname(goalPath), { recursive: true });

          progress++;
          percentage(progress / all.length, {
            prefix: "Writing",
          });

          console.log(goalPath);

          return writeFile(goalPath, await contents);
        },
      ),
    );
  } else {
    // Use the original registry-based approach for aside mode
    const base = resolve(ctx.cwd, inCompilerOptions.rootDir ?? ".");
    const outBase = resolve(ctx.cwd); // For aside mode, files stay in the same base

    programRegistry.rewriteAllRelativeImports(base, outBase);
    const rendered = programRegistry.writeAllFiles();

    await Promise.all(
      Array.from(rendered).map(async ([filePath, contents], _idx, all) => {
        const goalPath = resolve(ctx.cwd, filePath);
        await mkdir(dirname(goalPath), { recursive: true });

        progress++;
        percentage(progress / all.length, {
          prefix: "Writing",
        });

        console.log(goalPath);

        return writeFile(goalPath, await contents);
      }),
    );
  }
}
