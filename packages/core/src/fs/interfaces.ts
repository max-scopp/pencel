/**
 * Represents stats about a file or directory
 */
export interface Stats {
  isFile(): boolean;
  isDirectory(): boolean;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
}

/**
 * Options for file operations
 */
export interface FileOptions {
  encoding?: BufferEncoding;
  flag?: string;
}

/**
 * Represents a generic file system entry
 */
export interface FSEntry {
  path: string;
  stats(): Promise<Stats>;
  exists(): Promise<boolean>;
}

/**
 * Represents a file in the virtual file system
 */
export interface File extends FSEntry {
  read(options?: FileOptions): Promise<string | Buffer>;
  write(data: string | Buffer, options?: FileOptions): Promise<void>;
  append(data: string | Buffer, options?: FileOptions): Promise<void>;
  delete(): Promise<void>;
}

/**
 * Represents a directory in the virtual file system
 */
export interface Directory extends FSEntry {
  readdir(): Promise<string[]>;
  mkdir(recursive?: boolean): Promise<void>;
  rmdir(recursive?: boolean): Promise<void>;
}

/**
 * Operation types that can be recorded
 */
export enum OperationType {
  Write = "write",
  Append = "append",
  Delete = "delete",
  MkDir = "mkdir",
  RmDir = "rmdir",
}

/**
 * Represents a recorded file system operation
 */
export interface FSOperation {
  type: OperationType;
  path: string;
  data?: string | Buffer;
  options?: FileOptions;
  recursive?: boolean;
  timestamp: number;
}

/**
 * Main file system interface
 */
export interface FileSystem {
  // File operations
  readFile(path: string, options?: FileOptions): Promise<string | Buffer>;
  writeFile(
    path: string,
    data: string | Buffer,
    options?: FileOptions,
  ): Promise<void>;
  appendFile(
    path: string,
    data: string | Buffer,
    options?: FileOptions,
  ): Promise<void>;
  deleteFile(path: string): Promise<void>;

  // Directory operations
  readdir(path: string): Promise<string[]>;
  mkdir(path: string, recursive?: boolean): Promise<void>;
  rmdir(path: string, recursive?: boolean): Promise<void>;

  // Common operations
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<Stats>;

  // Build-time operations
  getOperations(): FSOperation[];
  commitOperations(): Promise<void>;
  clearOperations(): void;
}
