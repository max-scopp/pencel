import { createLog } from "@pencel/utils";
import { extractMetaFromDict } from "../analysis/component-analyzer.ts";
import { createPencilInputProgram } from "../resolution/module-resolver.ts";
import type {
  PencilConfig,
  TransformResult,
  TransformResults,
} from "../types/config-types.ts";

const log = createLog("Transform");

export const transform = async (
  config: PencilConfig,
  cwd?: string,
): Promise<TransformResults> => {
  log(`Processing dir: ${cwd}`);
  log(`Using Config: ${JSON.stringify(config, null, 2)}`);

  const inProg = await createPencilInputProgram(config, cwd ?? process.cwd());

  const metas = await extractMetaFromDict(inProg, config);

  const result = new Map<string, TransformResult[]>();

  metas.forEach((meta, file) => {
    result.set(
      file,
      meta.map((m) => ({ meta: m })),
    );
  });

  return result;
};
