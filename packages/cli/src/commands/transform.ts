import { type PencilConfig, transform } from "@pencel/core";
import { loadConfig } from "c12";
import { Command, Option } from "clipanion";
import { defaultConfig } from "../pencil.config";

export class TransformCommand extends Command {
  static override paths: string[][] = [Command.Default, ["transform"]];

  config: string =
    Option.String("--config,-C", {
      description: "Path to config file (defaults to pencil.config)",
    }) ?? "pencel.config";

  async execute(): Promise<0 | 1> {
    try {
      const { config, cwd } = await loadConfig<PencilConfig>({
        name: "pencel",
        configFile: this.config,
        defaults: defaultConfig,
      });

      const result = await transform(config, cwd);

      console.dir(result, {
        depth: null,
      });

      return 0;
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 1;
    }
  }
}
