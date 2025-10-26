import { createLog } from "@pencel/utils";
import { basename } from "path";
import { programFromTsConfig } from "ts-flattered";
import type ts from "typescript";
import { Config } from "../config.ts";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";

const log = createLog("Project");

export class Program {
  readonly config: Config = inject(Config);

  ts!: ts.Program;

  async load(): Promise<ts.Program> {
    log("Loading program...");

    const config = this.config;

    perf.start("program-creation");

    if (config.user.input.tsconfig) {
      log(`Using ${basename(config.user.input.tsconfig)}`);
      this.ts = programFromTsConfig(config.user.input.tsconfig);
    } else {
      throw new Error("You can only specify a tsconfig for now.");
    }

    perf.end("program-creation");

    log("Done");

    return this.ts;
  }
}
