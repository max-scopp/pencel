import { basename, resolve } from "node:path";
import { createLog } from "@pencel/utils";
import ts from "typescript";
import { Config } from "../config.ts";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";

const log = createLog("Project");

export class Program {
  readonly config: Config = inject(Config);
  #tsconfigPath?: string;
  #tsconfigContent?: string;

  ts!: ts.Program;
  tsconfig!: ts.ParsedCommandLine;

  async load(): Promise<ts.Program> {
    log("Loading program...");

    const config = this.config;

    perf.start("program-creation");

    if (config.user.input.tsconfig) {
      this.#tsconfigPath = resolve(config.cwd, config.user.input.tsconfig);
      log(`Using ${basename(this.#tsconfigPath)}`);

      const readFile = (path: string) => {
        this.#tsconfigContent = ts.sys.readFile(path);
        return this.#tsconfigContent;
      };

      const configFile = ts.readConfigFile(this.#tsconfigPath, readFile);

      if (configFile.error) {
        throw new Error(
          `Failed to read tsconfig: ${ts.formatDiagnostic(configFile.error, {
            getCanonicalFileName: (f) => f,
            getCurrentDirectory: () => config.cwd,
            getNewLine: () => "\n",
          })}`,
        );
      }

      this.tsconfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        config.cwd,
      );

      this.#verifyConfig();

      if (this.tsconfig.errors.length > 0) {
        throw new Error(
          `Failed to parse tsconfig: ${this.tsconfig.errors
            .map((d) =>
              ts.formatDiagnostic(d, {
                getCanonicalFileName: (f) => f,
                getCurrentDirectory: () => config.cwd,
                getNewLine: () => "\n",
              }),
            )
            .join("\n")}`,
        );
      }

      this.ts = ts.createProgram(
        this.tsconfig.fileNames,
        this.tsconfig.options,
        ts.createCompilerHost(this.tsconfig.options),
      );
    } else {
      throw new Error("You can only specify a tsconfig for now.");
    }

    perf.end("program-creation");

    log("Done");

    return this.ts;
  }

  #verifyConfig(): void {
    const opts = this.tsconfig.options;

    if (opts.jsx !== ts.JsxEmit.Preserve) {
      throw new Error(`[TSC] compilerOptions.jsx: must be "preserve"`);
    }

    if (opts.jsxImportSource !== "@pencel/runtime") {
      throw new Error(
        `[TSC] compilerOptions.jsxImportSource: must be "@pencel/runtime"`,
      );
    }

    if (!opts.experimentalDecorators) {
      throw new Error(
        `[TSC] compilerOptions.experimentalDecorators: must be true`,
      );
    }
  }
}
