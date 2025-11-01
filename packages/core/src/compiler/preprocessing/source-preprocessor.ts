import type { SourceFile } from "typescript";
import { inject } from "../core/container.ts";
import { SourceFiles } from "../core/source-files.ts";
import { ImportBuilder } from "./import-builder.ts";
import { ImportInjector } from "./import-injector.ts";
import { SymbolCollector } from "./symbol-collector.ts";
import { SymbolRegistry } from "./symbol-registry.ts";

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
   * Filters out self-imports and uses relative paths for project symbols.
   */
  process(sourceFile: SourceFile): SourceFile {
    const usedSymbols = this.#collector.collect(sourceFile);

    if (usedSymbols.size === 0) {
      return sourceFile;
    }

    // Filter out symbols that are defined/exported in this same file
    const externalSymbols = new Set<string>();
    for (const symbol of usedSymbols) {
      const config = this.#registry.lookup(symbol);
      if (!config) {
        continue;
      }
      // Skip symbols where the module is this file itself
      if (config.module === sourceFile.fileName) {
        continue;
      }
      externalSymbols.add(symbol);
    }

    if (externalSymbols.size === 0) {
      return sourceFile;
    }

    // Build requirements with relative import preference for project symbols
    const requirements = this.#builder.build(externalSymbols, {
      style: "relative",
      consumerPath: sourceFile.fileName,
    });

    if (requirements.length === 0) {
      return sourceFile;
    }

    const statements = this.#injector.injectImports(sourceFile, requirements);
    return this.#sourceFiles.setStatements(sourceFile, statements);
  }
}
