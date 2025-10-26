import { createLog } from "@pencel/utils";
import { PencelPlugin, Plugins } from "../../compiler/core/plugin.ts";

const log = createLog("AngularOutput");

declare module "../../compiler/types/plugins.ts" {
  interface PluginRegistry {
    typings: {
      class: ComponentTypingsPlugin;
      options: never;
    };
  }
}

class ComponentTypingsPlugin extends PencelPlugin {
  constructor() {
    super();

    this.handle("codegen", (hook) => {
      log(`Processing codegen hook for file: ${hook.input.fileName}`);
      // Angular-specific code generation logic would go here
    });
  }
}

Plugins.register("angular", ComponentTypingsPlugin, {
  enabled: true,
});
