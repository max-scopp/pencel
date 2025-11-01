import type { SourceFile } from "typescript";
import { inject } from "../core/container.ts";
import { ImportBuilder } from "./import-builder.ts";
import { ImportInjector } from "./import-injector.ts";
import { SymbolCollector } from "./symbol-collector.ts";

/**
 * Universal preprocessor: collect symbols, build requirements, inject imports.
 * Works uniformly for all file types via registry lookup.
 */
export class SourcePreprocessor {
  readonly #collector = inject(SymbolCollector);
  readonly #builder = inject(ImportBuilder);
  readonly #injector = inject(ImportInjector);

  /**
   * Process source file: collect symbols, build requirements, inject imports.
   */
  process(sourceFile: SourceFile): SourceFile {
    const usedSymbols = this.#collector.collect(sourceFile);

    if (usedSymbols.size === 0) {
      return sourceFile;
    }

    const requirements = this.#builder.build(usedSymbols);

    if (requirements.length === 0) {
      return sourceFile;
    }

    return this.#injector.injectImports(sourceFile, requirements);
  }
}
