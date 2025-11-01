import { createLog } from "@pencel/utils";
import { PencelPlugin, Plugins } from "../../compiler/core/plugin.ts";

const log = createLog("AngularOutput");

type AngularOutputOptions = {
  outputPath?: string;
};

export interface AngularOutputRegistry {
  angular: {
    class: AngularOutput;
    options: AngularOutputOptions;
  };
}

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
