import type { SourceFile } from "typescript";
import { extractExportedSymbols } from "../../ts-utils/extractExportedSymbols.ts";

export interface SymbolConfig {
  symbol: string;
  module: string;
  importStyle: "named" | "default";
  isType?: boolean;
}

export interface ImportPreference {
  style: "package" | "relative";
  packageName?: string;
}

/**
 * Registry lookup finds symbols automatically, respects import preferences.
 */
export class SymbolRegistry {
  readonly #wellKnown = new Map<string, SymbolConfig>();
  readonly #projectSymbols = new Map<string, SymbolConfig>();
  readonly #fileSymbols = new Map<string, Set<string>>();
  #importPreference: ImportPreference = { style: "package" };

  constructor() {
    this.#registerRuntimeSymbols();
  }

  /**
   * Set import preference for derived files.
   */
  setImportPreference(preference: ImportPreference): void {
    this.#importPreference = preference;
  }

  /**
   * Register stable APIs (runtime symbols, plugin-provided).
   */
  registerWellKnown(configs: SymbolConfig[]): void {
    for (const config of configs) {
      this.#wellKnown.set(config.symbol, config);
    }
  }

  /**
   * Register input symbols discovered from .pen files.
   */
  registerInputSymbol(symbol: string, module: string): void {
    if (!this.#projectSymbols.has(symbol)) {
      this.#projectSymbols.set(symbol, {
        symbol,
        module,
        importStyle: "named",
      });
    }
  }

  /**
   * Clear all registered input symbols, preserving well-known symbols.
   */
  clear(): void {
    this.#projectSymbols.clear();
    this.#fileSymbols.clear();
  }

  /**
   * Build symbol graph from all source files.
   * Scans exported symbols from each file and registers them.
   */
  buildSymbolGraph(sourceFiles: Iterable<SourceFile>): void {
    for (const sourceFile of sourceFiles) {
      this.upsertFileSymbols(sourceFile);
    }
  }

  /**
   * Scan a source file, extract exported symbols, and register them.
   * Tracks which symbols came from which file for rescanning.
   */
  upsertFileSymbols(sourceFile: SourceFile): void {
    const filePath = sourceFile.fileName;
    const symbols = extractExportedSymbols(sourceFile);

    // Remove old symbols from this file
    const oldSymbols = this.#fileSymbols.get(filePath);
    if (oldSymbols) {
      for (const symbol of oldSymbols) {
        this.#projectSymbols.delete(symbol);
      }
    }

    // Register new symbols
    this.#fileSymbols.set(filePath, symbols);
    for (const symbol of symbols) {
      this.#projectSymbols.set(symbol, {
        symbol,
        module: filePath,
        importStyle: "named",
      });
    }
  }

  /**
   * Lookup symbol in either bucket. Returns SymbolConfig or null.
   */
  lookup(symbol: string): SymbolConfig | null {
    const wellKnown = this.#wellKnown.get(symbol);
    if (wellKnown) {
      return wellKnown;
    }

    const project = this.#projectSymbols.get(symbol);
    if (project) {
      return this.#adaptToPreference(project);
    }

    return null;
  }

  /**
   * Get all registered symbols.
   */
  all(): SymbolConfig[] {
    return [
      ...Array.from(this.#wellKnown.values()),
      ...Array.from(this.#projectSymbols.values()).map((s) =>
        this.#adaptToPreference(s),
      ),
    ];
  }

  /**
   * Adapt module path based on import preference.
   */
  #adaptToPreference(config: SymbolConfig): SymbolConfig {
    if (config.module === "@pencel/runtime") {
      return config;
    }

    if (
      this.#importPreference.style === "package" &&
      this.#importPreference.packageName
    ) {
      return {
        ...config,
        module: this.#importPreference.packageName,
      };
    }

    return config;
  }

  #registerRuntimeSymbols(): void {
    const runtimeSymbols: SymbolConfig[] = [
      // zero-dom.ts
      { symbol: "dce", module: "@pencel/runtime", importStyle: "named" },
      { symbol: "dctn", module: "@pencel/runtime", importStyle: "named" },
      { symbol: "sp", module: "@pencel/runtime", importStyle: "named" },
      { symbol: "sc", module: "@pencel/runtime", importStyle: "named" },
      { symbol: "st", module: "@pencel/runtime", importStyle: "named" },
      { symbol: "ael", module: "@pencel/runtime", importStyle: "named" },
      { symbol: "mc", module: "@pencel/runtime", importStyle: "named" },
      // symbols.ts
      {
        symbol: "cacheSymbol",
        module: "@pencel/runtime",
        importStyle: "named",
      },
      {
        symbol: "eventListenersSymbol",
        module: "@pencel/runtime",
        importStyle: "named",
      },
      // internals.ts
      { symbol: "INTERNALS", module: "@pencel/runtime", importStyle: "named" },
    ];

    this.registerWellKnown(runtimeSymbols);
  }
}
