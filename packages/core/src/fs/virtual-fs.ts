import * as path from "node:path";
import type { FileOptions, FileSystem, FSOperation, Stats } from "./interfaces";
import { OperationType } from "./interfaces";

class VirtualStats implements Stats {
  constructor(
    private _isFile: boolean,
    private _isDir: boolean,
    public size: number = 0,
    public mtimeMs: number = Date.now(),
    public ctimeMs: number = Date.now(),
  ) {}

  isFile(): boolean {
    return this._isFile;
  }

  isDirectory(): boolean {
    return this._isDir;
  }
}

interface VirtualEntry {
  type: "file" | "directory";
  content?: string | Buffer;
  children: Map<string, VirtualEntry>;
  stats: VirtualStats;
}

export abstract class VirtualFileSystem implements FileSystem {
  private root: Map<string, VirtualEntry> = new Map();
  private operations: FSOperation[] = [];

  private ensurePath(filepath: string): {
    parent: Map<string, VirtualEntry>;
    name: string;
  } {
    const parts = filepath.split(path.sep).filter(Boolean);
    let current = this.root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      let entry = current.get(part);

      if (!entry) {
        entry = {
          type: "directory",
          children: new Map(),
          stats: new VirtualStats(false, true),
        };
        current.set(part, entry);
      }

      if (entry.type !== "directory") {
        throw new Error(
          `${parts.slice(0, i + 1).join(path.sep)} is not a directory`,
        );
      }

      current = entry.children;
    }

    return { parent: current, name: parts[parts.length - 1] };
  }

  private recordOperation(operation: FSOperation): void {
    this.operations.push({
      ...operation,
      timestamp: Date.now(),
    });
  }

  async readFile(
    _filepath: string,
    _options?: FileOptions,
  ): Promise<string | Buffer> {
    const { parent, name } = this.ensurePath(_filepath);
    const entry = parent.get(name);

    if (!entry || entry.type !== "file") {
      throw new Error(`File ${_filepath} not found`);
    }

    return entry.content || "";
  }

  async writeFile(
    filepath: string,
    data: string | Buffer,
    options?: FileOptions,
  ): Promise<void> {
    const { parent, name } = this.ensurePath(filepath);

    parent.set(name, {
      type: "file",
      content: data,
      children: new Map(),
      stats: new VirtualStats(true, false, Buffer.from(data).length),
    });

    this.recordOperation({
      type: OperationType.Write,
      path: filepath,
      data,
      options,
      timestamp: Date.now(),
    });
  }

  async appendFile(
    filepath: string,
    data: string | Buffer,
    options?: FileOptions,
  ): Promise<void> {
    const { parent, name } = this.ensurePath(filepath);
    const entry = parent.get(name);

    if (entry && entry.type === "file") {
      const newContent = Buffer.concat([
        Buffer.from(entry.content || ""),
        Buffer.from(data),
      ]);

      parent.set(name, {
        type: "file",
        content: newContent,
        children: new Map(),
        stats: new VirtualStats(true, false, newContent.length),
      });
    } else {
      await this.writeFile(filepath, data, options);
    }

    this.recordOperation({
      type: OperationType.Append,
      path: filepath,
      data,
      options,
      timestamp: Date.now(),
    });
  }

  async deleteFile(filepath: string): Promise<void> {
    const { parent, name } = this.ensurePath(filepath);
    const entry = parent.get(name);

    if (!entry || entry.type !== "file") {
      throw new Error(`File ${filepath} not found`);
    }

    parent.delete(name);

    this.recordOperation({
      type: OperationType.Delete,
      path: filepath,
      timestamp: Date.now(),
    });
  }

  async readdir(dirpath: string): Promise<string[]> {
    const { parent, name } = this.ensurePath(dirpath);
    const entry = parent.get(name);

    if (!entry || entry.type !== "directory") {
      throw new Error(`Directory ${dirpath} not found`);
    }

    return Array.from(entry.children.keys());
  }

  async mkdir(dirpath: string, recursive: boolean = false): Promise<void> {
    const parts = dirpath.split(path.sep).filter(Boolean);
    let current = this.root;

    for (const part of parts) {
      let entry = current.get(part);

      if (entry) {
        if (entry.type !== "directory") {
          throw new Error(`${part} is not a directory`);
        }
      } else {
        entry = {
          type: "directory",
          children: new Map(),
          stats: new VirtualStats(false, true),
        };
        current.set(part, entry);

        this.recordOperation({
          type: OperationType.MkDir,
          path: dirpath,
          recursive,
          timestamp: Date.now(),
        });
      }

      current = entry.children;
    }
  }

  async rmdir(dirpath: string, recursive: boolean = false): Promise<void> {
    const { parent, name } = this.ensurePath(dirpath);
    const entry = parent.get(name);

    if (!entry || entry.type !== "directory") {
      throw new Error(`Directory ${dirpath} not found`);
    }

    if (!recursive && entry.children.size > 0) {
      throw new Error(`Directory ${dirpath} is not empty`);
    }

    parent.delete(name);

    this.recordOperation({
      type: OperationType.RmDir,
      path: dirpath,
      recursive,
      timestamp: Date.now(),
    });
  }

  async exists(filepath: string): Promise<boolean> {
    try {
      const { parent, name } = this.ensurePath(filepath);
      return parent.has(name);
    } catch {
      return false;
    }
  }

  async stat(filepath: string): Promise<Stats> {
    const { parent, name } = this.ensurePath(filepath);
    const entry = parent.get(name);

    if (!entry) {
      throw new Error(`Path ${filepath} not found`);
    }

    return entry.stats;
  }

  getOperations(): FSOperation[] {
    return [...this.operations];
  }

  clearOperations(): void {
    this.operations = [];
  }

  abstract commitOperations(): Promise<void>;
}
