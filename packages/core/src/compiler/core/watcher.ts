import { createLog } from "@pencel/utils";
import chokidar from "chokidar";
import { Config } from "../config/config.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";
import { Compiler } from "./compiler.ts";
import { inject } from "./container.ts";
import { Program } from "./program.ts";

const log = createLog("Watcher");

export interface WatcherOptions {
  /** Debounce timeout in milliseconds */
  debounceMs?: number;
  /** Custom file patterns to watch */
  patterns?: string[];
  /** Directories to ignore */
  ignored?: string[];
}

export class Watcher {
  #compiler: Compiler = inject(Compiler);
  #config = inject(Config);
  #program = inject(Program);

  private watcher?: chokidar.FSWatcher;
  private rebuildTimeout: NodeJS.Timeout | null = null;
  private pendingFiles = new Set<string>();

  start(): void {
    log(`Starting file watcher in: ${this.#config}`);

    const options = {
      patterns: [
        `${this.#config.cwd}/**/*.ts`,
        `${this.#config.cwd}/**/*.tsx`,
        `${this.#config.cwd}/**/*.js`,
        `${this.#config.cwd}/**/*.jsx`,
        `${this.#config.cwd}/**/pencel.config.*`,
        `${this.#config.cwd}/**/pencil.config.*`,
      ],
      ignored: ["**/node_modules/**", "**/.git/**"],
    };

    // Set up file watcher with chokidar
    this.watcher = chokidar.watch(options.patterns, {
      ignored: options.ignored,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on("change", this.scheduleRebuild);
    this.watcher.on("add", this.scheduleRebuild);
    this.watcher.on("unlink", this.scheduleRebuild);

    this.watcher.on("error", (error) => {
      console.error("Watcher error:", error);
    });

    log("File watcher started successfully");

    // Handle graceful shutdown
    const handleExit = () => {
      this.stop();
      process.exit(0);
    };

    process.on("SIGINT", handleExit);
    process.on("SIGTERM", handleExit);
  }

  stop(): void {
    if (this.rebuildTimeout) {
      clearTimeout(this.rebuildTimeout);
      this.rebuildTimeout = null;
    }

    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }

    this.pendingFiles.clear();
    log("File watcher stopped");
  }

  private scheduleRebuild = (path: string): void => {
    // Check if this is one of our generated files using the proper marker utility
    if (this.isGeneratedFile(path)) {
      log(`Skipping change event for generated file: ${path}`);
      return;
    }

    this.pendingFiles.add(path);

    if (this.rebuildTimeout) {
      clearTimeout(this.rebuildTimeout);
    }

    // Debounce to handle rapid file changes
    this.rebuildTimeout = setTimeout(this.processChanges, 100);
  };

  private isGeneratedFile(path: string): boolean {
    try {
      // Get source file from the program to check if it's generated
      const sourceFile = this.#program.ts.getSourceFile(path);
      return sourceFile ? isPencelGeneratedFile(sourceFile) : false;
    } catch {
      log(
        `Warning: Could not check if file is generated: ${path}, treating as source file`,
      );
      // Treat as source file if we can't determine the status
      return false;
    }
  }

  private processChanges = async (): Promise<void> => {
    if (this.pendingFiles.size === 0) return;

    const filesToProcess = Array.from(this.pendingFiles);
    this.pendingFiles.clear();

    log(`Processing ${filesToProcess.length} changed files...`);

    try {
      // Process each changed file individually
      for (const filePath of filesToProcess) {
        await this.#compiler.transformFile(filePath);
      }

      // Flush all changes to disk
      await this.#compiler.flush();

      log(`Incremental rebuild complete for ${filesToProcess.length} files`);
    } catch (error) {
      console.error("Incremental rebuild failed:", error);
    }
  };
}
