import { createLog } from "@pencel/utils";
import type { ProgramBuilder } from "ts-flattered";
import type ts from "typescript";
import { ComponentsTransformer } from "../codegen/transform-components.ts";
import { SourceFileFactory } from "../factories/source-file-factory.ts";
import { writeAllFiles } from "../output/write-all-files.ts";
import { createPencilInputProgram } from "../resolution/module-resolver.ts";
import type {
  PencelContext,
  TransformResults,
} from "../types/compiler-types.ts";
import type { PencelConfig } from "../types/config-types.ts";
import { compilerTree } from "../utils/compilerTree.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";
import { inject } from "./container.ts";
import { PencilSourceFileRegistry } from "./pencel-source-file-registry.ts";
import { initializePlugins } from "./plugin.ts";
import { setPencilRegistry } from "./program-registry.ts";
import { Watcher } from "./watcher.ts";

const log = createLog("Transform");

export class Compiler {
  readonly componentsTransformer: ComponentsTransformer = inject(
    ComponentsTransformer,
  );

  private program?: ts.Program & ProgramBuilder;
  private context?: PencelContext;
  private pencilRegistry?: PencilSourceFileRegistry;

  get currentProgram(): ts.Program | undefined {
    return this.program;
  }

  async setup(config: Required<PencelConfig>, cwd?: string): Promise<void> {
    const ctx: PencelContext = {
      cwd: cwd ?? process.cwd(),
      config,
    };

    await initializePlugins(config, ctx);

    log(`Setting up compiler for: ${ctx.cwd}`);

    compilerTree.start("load-program");
    const inProgram = await createPencilInputProgram(config, ctx.cwd);
    compilerTree.end("load-program");

    // Initialize Pencel registry with the program and context
    const pencilRegistry = new PencilSourceFileRegistry(inProgram, ctx);
    setPencilRegistry(pencilRegistry);

    this.program = inProgram;
    this.context = ctx;
    this.pencilRegistry = pencilRegistry;
  }

  async transformFile(filePath: string): Promise<void> {
    if (!this.program || !this.context || !this.pencilRegistry) {
      throw new Error("Compiler not set up. Call setup() first.");
    }

    const sourceFile = this.program.getSourceFile(filePath);
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
        this.program,
        this.context,
      );

    if (newComponentFile) {
      // Create and register the transformed file
      const sourceFileFactory = new SourceFileFactory();
      const transformedFile =
        sourceFileFactory.createTransformedFile(sourceFile);
      this.pencilRegistry.registerTransformedFile(transformedFile, filePath);
    }
  }

  async flush(): Promise<void> {
    if (!this.context) {
      throw new Error("Compiler not set up. Call setup() first.");
    }

    log(`Flushing changes to disk...`);

    compilerTree.start("write");
    await writeAllFiles(this.context);
    compilerTree.end("write");

    log(`Flush complete`);
  }

  async transform(
    config: Required<PencelConfig>,
    cwd?: string,
  ): Promise<TransformResults> {
    compilerTree.start("transform");

    try {
      await this.setup(config, cwd);

      if (!this.program || !this.context) {
        throw new Error("Failed to setup compiler");
      }

      compilerTree.start("transform");
      await this.componentsTransformer.transform(this.program, this.context);
      compilerTree.end("transform");

      await this.flush();

      // biome-ignore lint/suspicious/noExplicitAny: temporary placeholder for transform results
      return {} as any;
    } finally {
      compilerTree.end("transform");
      compilerTree.log();
    }
  }

  async watch(
    config: Required<PencelConfig>,
    cwd?: string,
  ): Promise<() => void> {
    const workingDirectory = cwd ?? process.cwd();

    log(`Starting watch mode in: ${workingDirectory}`);

    // Perform initial setup and transform
    await this.transform(config, workingDirectory);

    // Create and start the watcher
    const watcher = new Watcher(this, workingDirectory);
    return await watcher.start();
  }
}
