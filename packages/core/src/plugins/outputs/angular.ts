import { createLog } from "@pencel/utils";
import { PencelPlugin, Plugins } from "../../compiler/core/plugin.ts";

const log = createLog("AngularOutput");

declare module "../../compiler/types/plugins.ts" {
  interface PluginRegistry {
    angular: {
      class: AngularOutput;
      options: AngularOutputOptions;
    };
  }
}

type AngularOutputOptions = {
  outputPath?: string;
};

class AngularOutput extends PencelPlugin {
  constructor(userOptions: AngularOutputOptions) {
    super();
    this.handle("derive", (hook) => {
      log(
        `Generate Framework bindings for file: ${hook.irr.node.fileName} to ${
          userOptions.outputPath
        }`,
      );
    });
  }
}

Plugins.register("angular", AngularOutput, {
  outputPath: "out/angular",
});
