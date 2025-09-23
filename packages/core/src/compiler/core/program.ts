import { createLog } from "@pencel/utils";
import { glob } from "fast-glob";
import { program, programFromTsConfig } from "ts-flattered";
import ts from "typescript";
import { perf } from "../utils/perf.ts";
import { CompilerContext } from "./compiler-context.ts";
import { inject } from "./container.ts";

const log = createLog("Project");

export class Program {
  readonly context: CompilerContext = inject(CompilerContext);

  ts!: ts.Program;

  async load(): Promise<ts.Program> {
    log("Loading program...");

    const config = this.context.config;

    perf.start("program-creation");
    if (typeof config.input === "string") {
      perf.start("glob-resolution");

      const files = await glob(config.input, {
        cwd: this.context.cwd,
        absolute: true,
      });

      perf.end("glob-resolution");

      // Use tsconfig from the context directory
      const tsconfigPath = ts.findConfigFile(
        this.context.cwd,
        ts.sys.fileExists,
        "tsconfig.json",
      );

      if (!tsconfigPath) {
        throw new Error(`Could not find tsconfig.json in ${this.context.cwd}`);
      }

      const { config: parsedTsConfig } = ts.readConfigFile(
        tsconfigPath,
        ts.sys.readFile,
      );

      const { options: baseCompilerOptions } = ts.parseJsonConfigFileContent(
        parsedTsConfig,
        ts.sys,
        this.context.cwd,
      );

      this.ts = program({
        rootNames: files,
        compilerOptions: baseCompilerOptions,
      });
    } else if (config.input.tsconfig) {
      this.ts = programFromTsConfig(config.input.tsconfig);
    }

    perf.end("program-creation");

    log("Done");

    return this.ts;
  }
}
