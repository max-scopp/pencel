import { createLog } from "@pencel/utils";
import chokidar from "chokidar";
import { ComponentsTransformer } from "../codegen/transform-components.ts";
import { writeAllFiles } from "../output/write-all-files.ts";
import { createPencilInputProgram } from "../resolution/module-resolver.ts";
import type {
  PencelContext,
  TransformResults,
} from "../types/compiler-types.ts";
import type { PencelConfig } from "../types/config-types.ts";
import { compilerTree } from "../utils/compilerTree.ts";
import { inject } from "./container.ts";
import { PencilSourceFileRegistry } from "./pencel-source-file-registry.ts";
import { initializePlugins } from "./plugin.ts";
import { setPencilRegistry } from "./program-registry.ts";

const log = createLog("Transform");

export class Compiler {
  readonly componentsTransformer: ComponentsTransformer = inject(
    ComponentsTransformer,
  );

  async transform(
    config: Required<PencelConfig>,
    cwd?: string,
  ): Promise<TransformResults> {
    compilerTree.start("transform");

    const ctx: PencelContext = {
      cwd: cwd ?? process.cwd(),
      config,
    };

    await initializePlugins(config, ctx);

    try {
      log(`Processing dir: ${cwd}`);

      compilerTree.start("load-program");
      const inProgram = await createPencilInputProgram(
        config,
        cwd ?? process.cwd(),
      );
      compilerTree.end("load-program");

      // Initialize Pencel registry with the program and context
      const pencilRegistry = new PencilSourceFileRegistry(inProgram, ctx);
      setPencilRegistry(pencilRegistry);

      compilerTree.start("transform");
      await this.componentsTransformer.transform(inProgram, ctx);
      compilerTree.end("transform");

      compilerTree.start("write");
      await writeAllFiles(ctx);
      compilerTree.end("write");

      // newSourceFiles.forEach(async (sf) => {
      //   console.log(
      //     await print(sf, {
      //       biome: {
      //         projectDir: ctx.cwd,
      //       },
      //     }),
      //   );
      // });

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
    
    // Perform initial transform
    await this.transform(config, workingDirectory);
    
    // Set up file watcher with chokidar
    const watcher = chokidar.watch([
      `${workingDirectory}/**/*.ts`,
      `${workingDirectory}/**/*.tsx`,
      `${workingDirectory}/**/*.js`,
      `${workingDirectory}/**/*.jsx`,
      `${workingDirectory}/**/pencel.config.*`,
      `${workingDirectory}/**/pencil.config.*`
    ], {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**'
      ],
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async (path) => {
      log(`File changed: ${path}, rebuilding...`);
      try {
        await this.transform(config, workingDirectory);
        log(`Rebuild complete`);
      } catch (error) {
        console.error("Rebuild failed:", error);
      }
    });

    watcher.on('add', async (path) => {
      log(`File added: ${path}, rebuilding...`);
      try {
        await this.transform(config, workingDirectory);
        log(`Rebuild complete`);
      } catch (error) {
        console.error("Rebuild failed:", error);
      }
    });

    watcher.on('unlink', async (path) => {
      log(`File removed: ${path}, rebuilding...`);
      try {
        await this.transform(config, workingDirectory);
        log(`Rebuild complete`);
      } catch (error) {
        console.error("Rebuild failed:", error);
      }
    });

    watcher.on('error', (error) => {
      console.error("Watcher error:", error);
    });

    // Return unsubscribe function
    return () => {
      watcher.close();
      log("Watch mode stopped");
    };
  }
}
