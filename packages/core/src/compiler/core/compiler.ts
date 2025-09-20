import { Config } from "@pencel/core";
import { createLog } from "@pencel/utils";
import { ComponentsTransformer } from "../codegen/transform-components.ts";
import { SourceFileFactory } from "../factories/source-file-factory.ts";
import { ComponentIRBuilder } from "../ir/component-ir-builder.ts";
import { writeAllFiles } from "../output/write-all-files.ts";
import type {
  PencelContext,
  TransformResults,
} from "../types/compiler-types.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";
import { perf } from "../utils/perf.ts";
import { inject } from "./container.ts";
import { initializePlugins } from "./plugin.ts";
import { Program } from "./program.ts";

const log = createLog("Transform");

export class Compiler {
  readonly componentsTransformer: ComponentsTransformer = inject(
    ComponentsTransformer,
  );
  readonly #config = inject(Config);

  readonly ir: ComponentIRBuilder = inject(ComponentIRBuilder);
  readonly program: Program = inject(Program);

  private sourceFileRegistry = inject(SourceFileFactory);

  get context(): PencelContext {
    return {
      cwd: this.#config.cwd,
      config: this.#config.config,
    };
  }

  async setup(): Promise<void> {
    await initializePlugins(this.context);

    log(`Setting up compiler for: ${this.context.cwd}`);

    await this.program.load();
  }

  async transformFile(filePath: string): Promise<void> {
    if (!this.program || !this.context || !this.sourceFileRegistry) {
      throw new Error("Compiler not set up. Call setup() first.");
    }

    const sourceFile = this.program.ts.getSourceFile(filePath);
    if (!sourceFile) {
      log(`File not found in program: ${filePath}`);
      return;
    }

    // Check if this is one of our own generated files to avoid infinite loops
    if (isPencelGeneratedFile(sourceFile)) {
      log(`Skipping generated file: ${filePath}`);
      return;
    }

    log(`Transforming single file: ${filePath}`);

    const newComponentFile =
      await this.componentsTransformer.componentsFileTransformer.transform(
        sourceFile,
      );

    if (newComponentFile) {
      // Create and register the transformed file
      const sourceFileFactory = new SourceFileFactory();
      const transformedFile =
        sourceFileFactory.createTransformedFile(sourceFile);
      this.sourceFileRegistry.registerTransformedFile(
        transformedFile,
        filePath,
      );
    }
  }

  async flush(): Promise<void> {
    if (!this.context) {
      throw new Error("Compiler not set up. Call setup() first.");
    }

    log(`Flushing changes to disk...`);

    perf.start("write");
    await writeAllFiles(this.context);
    perf.end("write");

    log(`Flush complete`);
  }

  async transform(): Promise<TransformResults> {
    perf.start("transform");

    try {
      await this.setup();

      if (!this.program || !this.context) {
        throw new Error("Failed to setup compiler");
      }

      perf.start("transform");
      await this.componentsTransformer.transform(this.program.ts, this.context);
      perf.end("transform");

      await this.flush();

      // biome-ignore lint/suspicious/noExplicitAny: temporary placeholder for transform results
      return {} as any;
    } finally {
      perf.end("transform");
      perf.log();
    }
  }
}
