import { createLog } from "@pencel/utils";
import { inject } from "../core/container.ts";
import { PencelPlugin, Plugins } from "../core/plugin.ts";
import { SourceFiles } from "../core/source-files.ts";
import type { FileIR } from "../ir/file.ts";
import type { ImplodeIRRefs } from "../ir/irri.ts";

const log = createLog("ComponentsExportGenerator");

declare module "../../compiler/types/plugins.ts" {
  interface PluginRegistry {
    components: {
      class: ComponentsExportGenerator;
      options: ComponentsExportGeneratorOptions;
    };
  }
}

export interface ComponentsExportGeneratorOptions {
  /**
   * @default "components.ts"
   */
  path: string;
}

class ComponentsExportGenerator extends PencelPlugin {
  #sourceFiles = inject(SourceFiles);

  constructor(userOptions: ComponentsExportGeneratorOptions) {
    super();

    this.handle("generate", async (hook) => {
      await this.#generateComponentsExports(hook.irs, userOptions.path);
    });
  }

  async #generateComponentsExports(
    fileIRs: Array<ImplodeIRRefs<FileIR>>,
    path: string,
  ): Promise<void> {
    // Collect all component class names from IR
    const componentClassNames = new Set<string>();
    for (const fileIR of fileIRs) {
      for (const componentIR of fileIR.components) {
        componentClassNames.add(componentIR.className);
      }
    }

    // Create barrel file that re-exports only component classes from all generated files
    this.#sourceFiles.barrel(path, "**", {
      symbols: Array.from(componentClassNames),
    });

    log(
      `Generated components barrel with ${componentClassNames.size} re-exports`,
    );
  }
}

Plugins.register("components", ComponentsExportGenerator, {
  path: "components.ts",
});
