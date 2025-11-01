import { readFileSync } from "node:fs";
import { join } from "node:path";
import { throwError } from "@pencel/utils";
import picomatch from "picomatch";
import {
  createSourceFile,
  factory,
  ScriptKind,
  ScriptTarget,
  type SourceFile,
  type Statement,
} from "typescript";
import { extractExportedSymbols } from "../../ts-utils/extractExportedSymbols.ts";
import { getRelativeImportPath } from "../../ts-utils/getRelativeImportPath.ts";
import { Config } from "../config.ts";
import type { ImportPreference } from "../preprocessing/symbol-registry.ts";
import { SymbolRegistry } from "../preprocessing/symbol-registry.ts";
import { inject } from "./container.ts";
import { Program } from "./program.ts";

export interface RenamableSourceFile extends SourceFile {
  outputFileName?: string;
}

export interface BarrelOptions {
  /**
   * Control which symbols to export.
   * - "all": export all symbols from matched files (default)
   * - Array of symbol names: export only these symbols from each matched file
   */
  symbols?: "all" | string[];
}

export class SourceFiles {
  #program = inject(Program);
  #config = inject(Config);
  #symbolRegistry = inject(SymbolRegistry);

  #generatedFiles = new Map<string, SourceFile>();

  #sourceFiles = new Map<string, RenamableSourceFile>();

  #filePreferences = new Map<string, ImportPreference>();

  /**
   * Loads source files from disk based on file paths discovered by Program
   * Should be called after Program.discover() and re-called on file changes
   */
  async loadSource(): Promise<void> {
    for (const filePath of this.#program.filePaths) {
      const source = readFileSync(filePath, "utf-8");
      const sourceFile = createSourceFile(
        filePath,
        source,
        ScriptTarget.Latest,
        true,
        ScriptKind.TSX,
      );
      this.#sourceFiles.set(filePath, sourceFile);
    }
  }

  /**
   * Clears all generated files and resets the generated files map.
   * Also clears input symbols to prepare for fresh discovery.
   * Should be called at the start of each compilation pass
   */
  clearGenerated(): void {
    this.#generatedFiles.clear();
    this.#symbolRegistry.clear();
    this.#filePreferences.clear();
  }

  getAll(): Map<string, RenamableSourceFile> {
    const result = new Map<string, RenamableSourceFile>();

    for (const [filePath, sourceFile] of this.#sourceFiles) {
      result.set(filePath, sourceFile);
    }

    for (const [filePath, sourceFile] of this.#generatedFiles) {
      result.set(filePath, sourceFile);
    }

    return result;
  }

  getSourceFile(filePath: string): SourceFile {
    return (
      this.#sourceFiles.get(filePath) ??
      this.#generatedFiles.get(filePath) ??
      throwError(`Source file not found: ${filePath}`)
    );
  }

  getOutputPath(sourceFile: SourceFile): string {
    const renamable = sourceFile as RenamableSourceFile;
    return renamable.outputFileName ?? sourceFile.fileName;
  }

  newFile(
    fileName: string,
    statements?: Statement[],
    options?: { preference?: ImportPreference },
  ): SourceFile {
    // Resolve fileName relative to baseDir and cwd
    const resolvedFileName = join(
      this.#config.cwd,
      this.#config.user.baseDir,
      fileName,
    );

    // Create empty source file first to get proper initialization
    const sourceFile = createSourceFile(
      resolvedFileName,
      "",
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );

    // Automatically register generated files so they're tracked and cleaned up
    this.#generatedFiles.set(resolvedFileName, sourceFile);

    if (statements) {
      this.setStatements(sourceFile, statements);
    }

    // Set import preference if provided
    if (options?.preference) {
      this.setImportPreference(resolvedFileName, options.preference);
    }

    return sourceFile;
  }

  /**
   * Updates or resets a SourceFile's statements
   * Returns a new SourceFile with updated statements, replacing it in the internal maps
   * Also rescans and updates exported symbols in the registry
   */
  setStatements(
    sourceFile: SourceFile,
    statements: readonly Statement[],
  ): SourceFile {
    const updated = factory.updateSourceFile(sourceFile, statements);

    // Update the file in the appropriate map
    const fileName = sourceFile.fileName;
    if (this.#sourceFiles.has(fileName)) {
      this.#sourceFiles.set(fileName, updated);
    } else if (this.#generatedFiles.has(fileName)) {
      this.#generatedFiles.set(fileName, updated);
    } else {
      throw new Error(`Source file not found in either map: ${fileName}`);
    }

    // Rescan exported symbols from the updated file
    this.#symbolRegistry.upsertFileSymbols(updated);

    return updated;
  }

  /**
   * Generate a barrel file that re-exports symbols from files matching a glob or regex pattern.
   * Accepts barrelPath as absolute, relative, or just a filename (resolved relative to baseDir).
   * Automatically registers the barrel file's exports in the symbol registry.
   * Use options to control which symbols are exported (default: all).
   * Returns the created barrel SourceFile.
   */
  barrel(
    barrelPath: string,
    sourceGlobOrRegex: string | RegExp,
    options: BarrelOptions = {},
  ): SourceFile {
    // Normalize barrelPath the same way as newFile() does internally
    const resolvedBarrelPath = join(
      this.#config.cwd,
      this.#config.user.baseDir,
      barrelPath,
    );

    const allFiles = this.getAll();
    const regex = this.#globToRegex(sourceGlobOrRegex);

    const symbolsOption = options.symbols ?? "all";
    const allowedSymbols =
      symbolsOption === "all" ? null : new Set(symbolsOption);

    // Collect matching files
    const matchingFiles: Array<{ path: string; symbols: Set<string> }> = [];
    for (const [filePath, sourceFile] of allFiles) {
      // Compare against resolved path, skip if it's the barrel file itself
      if (regex.test(filePath) && filePath !== resolvedBarrelPath) {
        let symbols = extractExportedSymbols(sourceFile);
        // Filter symbols if allowedSymbols is set
        if (allowedSymbols) {
          symbols = new Set(
            Array.from(symbols).filter((sym) => allowedSymbols.has(sym)),
          );
        }
        if (symbols.size > 0) {
          matchingFiles.push({ path: filePath, symbols });
        }
      }
    }

    // Create export statements for each matching file
    const exportStatements: Statement[] = matchingFiles.map(
      ({ path, symbols }) => {
        const relativeImportPath = getRelativeImportPath(
          resolvedBarrelPath,
          path,
        );
        const namedExports = Array.from(symbols).map((symbol) =>
          factory.createExportSpecifier(
            false,
            undefined,
            factory.createIdentifier(symbol),
          ),
        );

        return factory.createExportDeclaration(
          undefined,
          false,
          factory.createNamedExports(namedExports),
          factory.createStringLiteral(relativeImportPath),
          undefined,
        );
      },
    );

    // Create the barrel file using newFile (which resolves the path and registers it)
    const barrelFile = this.newFile(barrelPath, exportStatements);

    return barrelFile;
  }

  /**
   * Convert glob pattern to regex using picomatch for stable glob matching.
   * Supports common glob patterns:
   * - "**" -> match all files
   * - "**\/*.ts" -> match all .ts files
   * - "src/**\/*.gen.ts" -> match generated TypeScript files in src
   */
  #globToRegex(pattern: string | RegExp): RegExp {
    if (pattern instanceof RegExp) {
      return pattern;
    }

    // Use picomatch to create a proper glob matcher
    return picomatch.makeRe(pattern) as RegExp;
  }

  /**
   * Set import preferences for a source file to guide symbol resolution during preprocessing.
   * File preferences take precedence over global defaults when preprocessing this file.
   */
  setImportPreference(filePath: string, preference: ImportPreference): void {
    this.#filePreferences.set(filePath, preference);
  }

  /**
   * Get import preferences for a source file, or undefined if none set.
   */
  getImportPreference(filePath: string): ImportPreference | undefined {
    return this.#filePreferences.get(filePath);
  }

  /**
   * Clear all stored import preferences (typically called during clearGenerated).
   */
  clearPreferences(): void {
    this.#filePreferences.clear();
  }
}
