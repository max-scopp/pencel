import { dirname, relative } from "node:path";
import { createLog } from "@pencel/utils";
import { factory, type Statement } from "typescript";
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
    outputPath: string,
  ): Promise<void> {
    const exportStatements: Statement[] = [];
    const outputDir = dirname(outputPath);

    for (const fileIR of fileIRs) {
      for (const cir of fileIR.components) {
        let relativePath = relative(outputDir, fileIR.fileName);

        relativePath = relativePath.replace(/\\/g, "/");
        if (!relativePath.startsWith(".")) {
          relativePath = `./${relativePath}`;
        }

        // export { ClassName } from "./path/to/file.ts";
        const exportSpecifier = factory.createExportSpecifier(
          false,
          undefined,
          cir.className,
        );

        const exportDeclaration = factory.createExportDeclaration(
          undefined,
          false,
          factory.createNamedExports([exportSpecifier]),
          factory.createStringLiteral(relativePath),
        );

        exportStatements.push(exportDeclaration);
      }
    }

    this.#sourceFiles.newFile(outputPath, exportStatements);

    log(`Generated components with ${exportStatements.length} re-exports`);
  }
}

Plugins.register("components", ComponentsExportGenerator, {
  path: "components.ts",
});
