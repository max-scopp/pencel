import { throwConsumerError } from "@pencel/utils";
import glob from "fast-glob";
import {
  type ProgramBuilder,
  program,
  programFromTsConfig,
} from "ts-flattered";
import type ts from "typescript";
import type { PencilConfig } from "../types/config-types.ts";

export async function createPencilInputProgram(
  config: PencilConfig,
  cwd: string,
): Promise<ProgramBuilder & ts.Program> {
  if (typeof config.input === "string") {
    const files = await glob(config.input, { cwd, absolute: true });

    return program({
      rootNames: files,
    });
  }

  if (config.input.tsconfig) {
    return programFromTsConfig(config.input.tsconfig);
  }

  throwConsumerError(
    "Invalid input configuration. Must be a glob pattern or an object with a tsconfig property.",
  );
}
