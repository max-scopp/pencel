import { Compiler, inject, Watcher } from "@pencel/core";
import { log } from "@pencel/utils";
import { Command, Option } from "clipanion";

export class TransformCommand extends Command {
  static override paths: string[][] = [Command.Default, ["transform"]];
  readonly #compiler: Compiler = inject(Compiler);
  readonly #watcher: Watcher = inject(Watcher);

  config?: string = Option.String("--config,-C", {
    description: "Path to config file (defaults to pencil.config)",
  });

  watch: boolean =
    Option.Boolean("--watch,-w", {
      description: "Watch for file changes and rebuild automatically",
    }) ?? false;

  async execute(): Promise<0 | 1> {
    const now = performance.now();

    await this.#compiler.init(this.config);
    await this.#compiler.compile();

    log(`Done in ${((performance.now() - now) / 1000).toFixed(2)}s`);

    if (this.watch) {
      this.#watcher.start();
    }

    return 0;
  }
}
