import { writeFile } from "node:fs/promises";
import { relative } from "node:path";
import { createLog } from "@pencel/utils";
import { Config } from "../config.ts";
import { inject } from "../core/container.ts";
import { PencelPlugin, Plugins } from "../core/plugin.ts";

const log = createLog("IRGenerator");

declare module "../../compiler/types/plugins.ts" {
  interface PluginRegistry {
    ir: {
      class: IRGenerator;
      options: IRGeneratorOptions;
    };
  }
}

export interface IRGeneratorOptions {
  /**
   * @default "ir.json"
   */
  path: string;
}

class IRGenerator extends PencelPlugin {
  #config = inject(Config);

  constructor(userOptions: IRGeneratorOptions) {
    super();

    this.handle("generate", async (hook) => {
      await writeFile(userOptions.path, JSON.stringify(hook.irs, null, 2));
      log(`Wrote IR to ${relative(this.#config.cwd, userOptions.path)}`);
    });
  }
}

Plugins.register("ir", IRGenerator, {
  path: "ir.json",
});
