import { createLog } from "@pencel/utils";
import chokidar from "chokidar";
import { Config } from "../config.ts";
import { perf } from "../utils/perf.ts";
import { Compiler } from "./compiler.ts";
import { inject } from "./container.ts";

const log = createLog("Watcher");

export class Watcher {
  #compiler: Compiler = inject(Compiler);
  #config: Config = inject(Config);

  private watcher?: chokidar.FSWatcher;
  private rebuildTimeout: NodeJS.Timeout | null = null;
  private changedFiles: Set<string> = new Set();

  start(): void {
    const { cwd, user } = this.#config;

    // Watch pattern: all files matching the input qualifier
    const pattern = `${cwd}/**/*.${user.input.qualifier}.tsx`;

    log(`Watching: ${pattern}`);

    this.watcher = chokidar.watch(pattern, {
      ignored: ["**/node_modules/**", "**/.git/**", "**/.{idea,vscode}/**"],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    });

    this.watcher.on("change", this.scheduleRebuild);
    this.watcher.on("add", this.scheduleRebuild);
    this.watcher.on("unlink", this.scheduleRebuild);

    this.watcher.on("error", (error) => {
      log(`Watcher error: ${error.message}`);
    });

    log("File watcher started");

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

    log("File watcher stopped");
  }

  private scheduleRebuild = (path: string): void => {
    this.changedFiles.add(path);

    if (this.rebuildTimeout) {
      clearTimeout(this.rebuildTimeout);
    }

    // Debounce rapid file changes
    this.rebuildTimeout = setTimeout(() => {
      this.rebuild().catch((error) => {
        log(`Rebuild failed: ${error.message}`);
      });
    }, 100);
  };

  private async rebuild(): Promise<void> {
    const now = performance.now();

    try {
      if (this.changedFiles.size === 0) {
        return;
      }

      const changedFilesArray = Array.from(this.changedFiles);
      this.changedFiles.clear();

      log(`Rebuilding ${changedFilesArray.length} changed file(s)...`);

      // Let compiler recompute graph and transform only changed files
      await this.#compiler.compileChangedFiles(changedFilesArray);

      const duration = ((performance.now() - now) / 1000).toFixed(2);
      log(`Rebuild complete in ${duration}s`);
      perf.log();
    } catch (error) {
      log(
        `Rebuild error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
