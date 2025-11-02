import type { SourceFile } from "typescript";
import { getOutputPath } from "../../ts-utils/getOutputPath.ts";
import { inject } from "../core/container.ts";
import { SourceFiles } from "../core/source-files.ts";
import { ImportBuilder } from "./import-builder.ts";
import { ImportInjector } from "./import-injector.ts";
import { SymbolCollector } from "./symbol-collector.ts";
import { type ImportPreference, SymbolRegistry } from "./symbol-registry.ts";

/**
 * Universal preprocessor: collect symbols, build requirements, inject imports.
 * Works uniformly for all file types via registry lookup.
 */
export class SourcePreprocessor {
  readonly #collector = inject(SymbolCollector);
  readonly #builder = inject(ImportBuilder);
  readonly #injector = inject(ImportInjector);
  readonly #sourceFiles = inject(SourceFiles);
  readonly #registry = inject(SymbolRegistry);

  /**
   * Process source file: collect symbols, build requirements, inject imports.
   * Filters out self-imports.
   * Default: uses relative imports for project symbols (can be overridden with preference).
   */
  process(sourceFile: SourceFile, preference?: ImportPreference): SourceFile {
    const usedSymbols = this.#collector.collect(sourceFile);

    if (usedSymbols.size === 0) {
      return sourceFile;
    }

    const outputPath = getOutputPath(sourceFile);

    // Filter out symbols that are defined/exported in this same file
    const externalSymbols = new Set<string>();
    for (const symbol of usedSymbols) {
      const config = this.#registry.lookup(symbol);
      if (!config) {
        continue;
      }
      // Skip symbols where the module is this file itself
      if (config.module === outputPath) {
        continue;
      }
      externalSymbols.add(symbol);
    }

    if (externalSymbols.size === 0) {
      return sourceFile;
    }

    // Use provided preference or default to relative imports
    const importPreference: ImportPreference = preference || {
      style: "relative",
      consumerPath: outputPath,
    };

    // Ensure consumerPath is set for relative style
    if (importPreference.style === "relative" && !importPreference.consumerPath) {
      importPreference.consumerPath = outputPath;
    }

    // Build requirements with import preference
    const requirements = this.#builder.build(externalSymbols, importPreference);

    if (requirements.length === 0) {
      return sourceFile;
    }

    const statements = this.#injector.injectImports(sourceFile, requirements);
    return this.#sourceFiles.setStatements(sourceFile, statements);
  }
}
