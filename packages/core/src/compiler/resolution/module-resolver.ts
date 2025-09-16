import { ConsumerError } from "@pencel/utils";
import glob from "fast-glob";
import {
  type ProgramBuilder,
  program,
  programFromTsConfig,
} from "ts-flattered";
import type { Program } from "typescript";
import type { PencelConfig } from "../types/config-types.ts";
import { compilerTree } from "../utils/compilerTree.ts";

export async function createPencilInputProgram(
  config: PencelConfig,
  cwd: string,
): Promise<ProgramBuilder & Program> {
  if (typeof config.input === "string") {
    compilerTree.start("glob-resolution");
    const files = await glob(config.input, { cwd, absolute: true });
    compilerTree.end("glob-resolution");

    compilerTree.start("program-creation-from-files");
    const result = program({
      rootNames: files,
    });
    compilerTree.end("program-creation-from-files");

    return result;
  }

  if (config.input?.tsconfig) {
    compilerTree.start("program-creation-from-tsconfig");
    const result = programFromTsConfig(config.input.tsconfig);
    compilerTree.end("program-creation-from-tsconfig");

    return result;
  }

  throw new ConsumerError(
    "Invalid input configuration. Must be a glob pattern or an object with a tsconfig property.",
  );
}
