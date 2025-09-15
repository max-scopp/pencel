import {
  createLog,
  createPerformanceTree,
  type PerformanceTreeController,
} from "@pencel/utils";
import { transformComponents } from "../codegen/transform-components.ts";
import { writeAllFiles } from "../output/write-all-files.ts";
import { createPencilInputProgram } from "../resolution/module-resolver.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import type { PencelConfig, TransformResults } from "../types/config-types.ts";

const log = createLog("Transform");

export const compilerTree: PerformanceTreeController =
  createPerformanceTree("Compiler");

export const transform = async (
  config: Required<PencelConfig>,
  cwd?: string,
): Promise<TransformResults> => {
  compilerTree.start("transform");

  const ctx: PencelContext = {
    cwd: cwd ?? process.cwd(),
    config,
  };

  try {
    log(`Processing dir: ${cwd}`);

    compilerTree.start("load-program");
    const inProg = await createPencilInputProgram(config, cwd ?? process.cwd());
    compilerTree.end("load-program");

    compilerTree.start("transform");
    const newSourceFiles = await transformComponents(inProg, ctx);
    compilerTree.end("transform");

    compilerTree.start("write");
    await writeAllFiles(newSourceFiles, ctx);
    compilerTree.end("write");

    // newSourceFiles.forEach(async (sf) => {
    //   console.log(
    //     await print(sf, {
    //       biome: {
    //         projectDir: ctx.cwd,
    //       },
    //     }),
    //   );
    // });

    return {} as any;
  } finally {
    compilerTree.end("transform");
    compilerTree.log();
  }
};
