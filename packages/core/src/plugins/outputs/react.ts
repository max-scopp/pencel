import { createLog } from "@pencel/utils";
import { PencelPlugin, Plugins } from "../../compiler/core/plugin.ts";

const log = createLog("ReactOutput");

type ReactOutputOptions = {
  outputPath?: string;
};

export interface ReactOutputRegistry {
  react: {
    class: ReactOutput;
    options: ReactOutputOptions;
  };
}

class ReactOutput extends PencelPlugin {
  constructor(userOptions: ReactOutputOptions) {
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

Plugins.register("react", ReactOutput, {
  outputPath: "out/react",
});
