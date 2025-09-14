import {
  createLog,
  createPerformanceTree,
  type PerformanceTreeController,
} from "@pencel/utils";
import { extractMetaFromDict } from "../analysis/component-analyzer.ts";
import { createPencilInputProgram } from "../resolution/module-resolver.ts";
import type {
  PencilConfig,
  TransformResult,
  TransformResults,
} from "../types/config-types.ts";

const log = createLog("Transform");

export const compilerTree: PerformanceTreeController =
  createPerformanceTree("Compiler");

export const transform = async (
  config: PencilConfig,
  cwd?: string,
): Promise<TransformResults> => {
  compilerTree.start("transform");

  try {
    log(`Processing dir: ${cwd}`);

    compilerTree.start("program-creation");
    const inProg = await createPencilInputProgram(config, cwd ?? process.cwd());
    compilerTree.end("program-creation");

    compilerTree.start("metadata-extraction");
    const metas = await extractMetaFromDict(inProg, config);
    compilerTree.end("metadata-extraction");

    compilerTree.start("result-mapping");
    const result = new Map<string, TransformResult[]>();

    metas.forEach((meta, file) => {
      result.set(
        file,
        meta.map((m) => ({ meta: m })),
      );
    });
    compilerTree.end("result-mapping");

    return result;
  } finally {
    compilerTree.end("transform");
    compilerTree.log();
  }
};
