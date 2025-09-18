import { type PencilConfig, transform } from "@pencel/core";
import { log } from "@pencel/utils";
import { loadConfig } from "c12";
import { Command, Option } from "clipanion";
import { defaultConfig } from "../index.ts";

export class TransformCommand extends Command {
  static override paths: string[][] = [Command.Default, ["transform"]];

  config: string =
    Option.String("--config,-C", {
      description: "Path to config file (defaults to pencil.config)",
    }) ?? "pencel.config";

  async execute(): Promise<0 | 1> {
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

    log(`Done in ${((performance.now() - now) / 1000).toFixed(2)}s`);

    return 0;
  }
}
