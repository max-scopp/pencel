import { resolve } from "node:path";
import { createLog, throwError } from "@pencel/utils";
import fg from "fast-glob";
import ts from "typescript";
import { Config } from "../config.ts";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";

const log = createLog("Project");

export class Program {
  readonly #config: Config = inject(Config);

  #tsconfigPath?: string;
  #tsconfigContent?: string;
  #filePaths: string[] = [];

  tsconfig!: ts.ParsedCommandLine;

  /**
   * Discovers input files by loading and validating tsconfig, then globbing for files
   * Should be called once on startup and re-called on tsconfig changes
   */
  async discover(): Promise<string[]> {
    const config = this.#config;

    perf.start("verify-tsconfig");

    const tsconfigPath =
      config.user.tsconfig ?? throwError("tsconfig not specified");

    this.#tsconfigPath = resolve(config.cwd, tsconfigPath);

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

    perf.end("verify-tsconfig");

    perf.start("discover-files");

    const pattern = `**/*.${config.user.input.qualifier}.tsx`;
    this.#filePaths = await fg(pattern, {
      cwd: config.cwd,
      absolute: true,
    });

    perf.end("discover-files");
    log(`Found ${this.#filePaths.length} input file(s)`);

    return this.#filePaths;
  }

  /**
   * Returns the discovered file paths
   */
  get filePaths(): string[] {
    return this.#filePaths;
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
