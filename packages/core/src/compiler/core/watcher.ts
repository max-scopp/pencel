import { createLog } from "@pencel/utils";
import chokidar from "chokidar";
import { isPencelGeneratedFile } from "../utils/marker.ts";
import type { Compiler } from "./compiler.ts";

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
  private watcher?: chokidar.FSWatcher;
  private rebuildTimeout: NodeJS.Timeout | null = null;
  private pendingFiles = new Set<string>();
  private compiler: Compiler;
  private workingDirectory: string;
  private options: Required<WatcherOptions>;

  constructor(
    compiler: Compiler,
    workingDirectory: string,
    options: WatcherOptions = {},
  ) {
    this.compiler = compiler;
    this.workingDirectory = workingDirectory;
    this.options = {
      debounceMs: options.debounceMs ?? 100,
      patterns: options.patterns ?? [
        `${workingDirectory}/**/*.ts`,
        `${workingDirectory}/**/*.tsx`,
        `${workingDirectory}/**/*.js`,
        `${workingDirectory}/**/*.jsx`,
        `${workingDirectory}/**/pencel.config.*`,
        `${workingDirectory}/**/pencil.config.*`,
      ],
      ignored: options.ignored ?? ["**/node_modules/**", "**/.git/**"],
    };
  }

  async start(): Promise<() => void> {
    log(`Starting file watcher in: ${this.workingDirectory}`);

    // Set up file watcher with chokidar
    this.watcher = chokidar.watch(this.options.patterns, {
      ignored: this.options.ignored,
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

    // Return stop function
    return this.stop.bind(this);
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
    this.rebuildTimeout = setTimeout(
      this.processChanges,
      this.options.debounceMs,
    );
  };

  private isGeneratedFile(path: string): boolean {
    try {
      const program = this.compiler.currentProgram;
      if (!program) {
        log("Program not initialized, cannot check if file is generated");
        return false;
      }

      // Get source file from the program to check if it's generated
      const sourceFile = program.getSourceFile(path);
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
        await this.compiler.transformFile(filePath);
      }

      // Flush all changes to disk
      await this.compiler.flush();

      log(`Incremental rebuild complete for ${filesToProcess.length} files`);
    } catch (error) {
      console.error("Incremental rebuild failed:", error);
    }
  };
}
