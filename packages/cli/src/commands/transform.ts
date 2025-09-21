import {
  Compiler,
  CompilerContext,
  Config,
  Plugins,
  Program,
  Watcher,
} from "@pencel/core";
import { log } from "@pencel/utils";
import { Command, Option } from "clipanion";
import { inject } from "../../../core/src/compiler/core/container.ts";

export class TransformCommand extends Command {
  static override paths: string[][] = [Command.Default, ["transform"]];
  readonly #watcher: Watcher = inject(Watcher);
  readonly #config: Config = inject(Config);
  readonly #compiler: Compiler = inject(Compiler);
  readonly #program: Program = inject(Program);
  readonly #plugins: Plugins = inject(Plugins);
  readonly #compilerContext: CompilerContext = inject(CompilerContext);

  config: string =
    Option.String("--config,-C", {
      description: "Path to config file (defaults to pencil.config)",
    }) ?? "pencel.config";

  watch: boolean =
    Option.Boolean("--watch,-w", {
      description: "Watch for file changes and rebuild automatically",
    }) ?? false;

  async execute(): Promise<0 | 1> {
    const now = performance.now();

    await this.#config.load(this.config);
    await this.#program.load();
    await this.#plugins.initialize();
    await this.#compilerContext.adopt(this.#config.cwd, this.#config.config);

    const result = await this.#compiler.transform();

    if (this.watch) {
      this.#watcher.start();

      return 0;
    } else {
      console.dir(result, {
        depth: null,
      });

      log(`Done in ${((performance.now() - now) / 1000).toFixed(2)}s`);

      return 0;
    }
  }
}
