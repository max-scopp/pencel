import { createLog } from "@pencel/utils";
import { transformComponents } from "../codegen/transform-components.ts";
import { writeAllFiles } from "../output/write-all-files.ts";
import { createPencilInputProgram } from "../resolution/module-resolver.ts";
import type {
  PencelContext,
  TransformResults,
} from "../types/compiler-types.ts";
import type { PencelConfig } from "../types/config-types.ts";
import { compilerTree } from "../utils/compilerTree.ts";
import { PencilSourceFileRegistry } from "./pencel-source-file-registry.ts";
import { initializePlugins } from "./plugin.ts";
import { setPencilRegistry } from "./program-registry.ts";

const log = createLog("Transform");

// TODO: Refactor to compiler context
export const transform = async (
  config: Required<PencelConfig>,
  cwd?: string,
): Promise<TransformResults> => {
  compilerTree.start("transform");

  const ctx: PencelContext = {
    cwd: cwd ?? process.cwd(),
    config,
  };

  await initializePlugins(config, ctx);

  try {
    log(`Processing dir: ${cwd}`);

    compilerTree.start("load-program");
    const inProgram = await createPencilInputProgram(
      config,
      cwd ?? process.cwd(),
    );
    compilerTree.end("load-program");

    // Initialize Pencel registry with the program and context
    const pencilRegistry = new PencilSourceFileRegistry(inProgram, ctx);
    setPencilRegistry(pencilRegistry);

    compilerTree.start("transform");
    await transformComponents(inProgram, ctx);
    compilerTree.end("transform");

    compilerTree.start("write");
    await writeAllFiles(ctx);
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

    // biome-ignore lint/suspicious/noExplicitAny: temporary placeholder for transform results
    return {} as any;
  } finally {
    compilerTree.end("transform");
    compilerTree.log();
  }
};
