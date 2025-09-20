import { Compiler } from "@pencel/core";
import { createLog } from "@pencel/utils";
import { glob } from "fast-glob";
import { program, programFromTsConfig } from "ts-flattered";
import type ts from "typescript";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";

const log = createLog("Project");

export class Program {
  readonly compiler: Compiler = inject(Compiler);

  ts!: ts.Program;

  async load(): Promise<ts.Program> {
    log("Loading program...");

    const config = this.compiler.context.config;

    perf.start("program-creation");
    if (typeof config.input === "string") {
      perf.start("glob-resolution");

      const files = await glob(config.input, {
        cwd: this.compiler.context.cwd,
        absolute: true,
      });

      perf.end("glob-resolution");

      this.ts = program({
        rootNames: files,
      });
    } else if (config.input.tsconfig) {
      this.ts = programFromTsConfig(config.input.tsconfig);
    }

    perf.end("program-creation");

    log("Done");

    return this.ts;
  }
}
