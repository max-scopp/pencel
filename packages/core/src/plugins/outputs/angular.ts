import { createLog } from "@pencel/utils";
import { PencelPlugin, Plugins } from "../../compiler/core/plugin.ts";
import type { BasePluginOptions } from "../../compiler/types/plugins.ts";

const log = createLog("AngularOutput");

declare module "../../compiler/types/plugins.ts" {
  interface PluginRegistry {
    angular: {
      class: AngularOutput;
      options: AngularOutputOptions;
    };
  }
}

type AngularOutputOptions = {};

class AngularOutput extends PencelPlugin {
  constructor(userOptions: AngularOutputOptions) {
    super();
    log(
      `Angular output plugin initialized with options: ${JSON.stringify(userOptions)}`,
    );

    this.handle("codegen", (hook) => {
      log(`Processing codegen hook for file: ${hook.input.fileName}`);
      // Angular-specific code generation logic would go here
    });
  }
}

Plugins.register("angular", AngularOutput, {});
