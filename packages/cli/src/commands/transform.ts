import { Compiler, type PencilConfig } from "@pencel/core";
import { log } from "@pencel/utils";
import { loadConfig } from "c12";
import { Command, Option } from "clipanion";
import { inject } from "../../../core/src/compiler/core/container.ts";
import { defaultConfig } from "../index.ts";

export class TransformCommand extends Command {
  static override paths: string[][] = [Command.Default, ["transform"]];

  config: string =
    Option.String("--config,-C", {
      description: "Path to config file (defaults to pencil.config)",
    }) ?? "pencel.config";

  watch: boolean =
    Option.Boolean("--watch,-w", {
      description: "Watch for file changes and rebuild automatically",
    }) ?? false;

  async execute(): Promise<0 | 1> {
    const { config, cwd } = await loadConfig<Required<PencilConfig>>({
      name: "pencel",
      configFile: this.config,
      defaults: defaultConfig,
    });

    const now = performance.now();

    const compiler: Compiler = inject(Compiler);

    if (this.watch) {
      log("Starting in watch mode...");
      const unsubscribe = await compiler.watch(config, cwd);

      // Handle graceful shutdown
      const handleExit = () => {
        unsubscribe();
        process.exit(0);
      };

      process.on("SIGINT", handleExit);
      process.on("SIGTERM", handleExit);

      // Keep the process running
      return new Promise(() => {});
    } else {
      const result = await compiler.transform(config, cwd);

      console.dir(result, {
        depth: null,
      });

      log(`Done in ${((performance.now() - now) / 1000).toFixed(2)}s`);

      return 0;
    }
  }
}
