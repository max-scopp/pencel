import * as fs from "node:fs/promises";
import * as path from "node:path";
import { VirtualFileSystem } from "./virtual-fs.ts";

export class BuildFileSystem extends VirtualFileSystem {
  constructor(private readonly outputDir: string) {
    super();
  }

  override async commitOperations(): Promise<void> {
    const operations = this.getOperations();

    // Sort operations by timestamp to maintain order
    operations.sort((a, b) => a.timestamp - b.timestamp);

    // Process each operation in order
    for (const operation of operations) {
      const fullPath = path.join(this.outputDir, operation.path);
      const dir = path.dirname(fullPath);

      switch (operation.type) {
        case "write":
          if (operation.data) {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, operation.data, operation.options);
          }
          break;

        case "append":
          if (operation.data) {
            await fs.mkdir(dir, { recursive: true });
            await fs.appendFile(fullPath, operation.data, operation.options);
          }
          break;

        case "delete":
          await fs.unlink(fullPath).catch(() => {});
          break;

        case "mkdir":
          await fs.mkdir(fullPath, { recursive: operation.recursive });
          break;

        case "rmdir":
          if (operation.recursive) {
            await fs.rm(fullPath, { recursive: true, force: true });
          } else {
            await fs.rmdir(fullPath);
          }
          break;
      }
    }

    // Clear the operations after successful commit
    this.clearOperations();
  }
}
