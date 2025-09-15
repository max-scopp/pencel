import {
  createLog,
  createPerformanceTree,
  type PerformanceTreeController,
} from "@pencel/utils";
import { print } from "ts-flattered";
import { transformComponents } from "../codegen/transform-components.ts";
import { createPencilInputProgram } from "../resolution/module-resolver.ts";
import type { PencelConfig, TransformResults } from "../types/config-types.ts";

const log = createLog("Transform");

export const compilerTree: PerformanceTreeController =
  createPerformanceTree("Compiler");

export const transform = async (
  config: PencelConfig,
  cwd?: string,
): Promise<TransformResults> => {
  compilerTree.start("transform");

  try {
    log(`Processing dir: ${cwd}`);

    compilerTree.start("analyzer-creation");
    const inProg = await createPencilInputProgram(config, cwd ?? process.cwd());
    compilerTree.end("analyzer-creation");

    compilerTree.start("metadata-extraction");
    const newSourceFiles = await transformComponents(inProg, config);
    compilerTree.end("metadata-extraction");

    newSourceFiles.forEach((sf) => {
      console.log(print(sf));
    });

    return {} as any;
  } finally {
    compilerTree.end("transform");
    compilerTree.log();
  }
};
