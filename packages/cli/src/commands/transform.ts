import { type PencilConfig, transform } from "@pencel/core";
import { error } from "@pencel/utils";
import { loadConfig } from "c12";
import { Command, Option } from "clipanion";
import { log } from "console";
import { defaultConfig } from "../index.ts";

export class TransformCommand extends Command {
  static override paths: string[][] = [Command.Default, ["transform"]];

  config: string =
    Option.String("--config,-C", {
      description: "Path to config file (defaults to pencil.config)",
    }) ?? "pencel.config";

  async execute(): Promise<0 | 1> {
    try {
      const { config, cwd } = await loadConfig<Required<PencilConfig>>({
        name: "pencel",
        configFile: this.config,
        defaults: defaultConfig,
      });

      const now = performance.now();
      const result = await transform(config, cwd);

      console.dir(result, {
        depth: null,
      });

      console.log();
      console.log();
      console.log();
      console.log();
      console.log();
      log(`Transform completed in ${(performance.now() - now).toFixed(2)}ms`);

      return 0;
    } catch (e) {
      error(e);
      return 1;
    }
  }
}
