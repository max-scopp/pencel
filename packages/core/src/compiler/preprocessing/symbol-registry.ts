import type { SourceFile } from "typescript";
import { extractExportedSymbols } from "../../ts-utils/extractExportedSymbols.ts";
import { getRelativeImportPath } from "../../ts-utils/getRelativeImportPath.ts";

export interface SymbolConfig {
  symbol: string;
  module: string;
  importStyle: "named" | "default";
  isType?: boolean;
}

export interface ImportPreference {
  /**
   * Import style for project symbols.
   * - "package": use packageName for imports (e.g., `import { Button } from "@mylib/components"`)
   * - "relative": compute relative import path from consuming file to source file
   * - "deep": use the full package path (e.g., `import { Button } from "@mylib/components/button"`)
   */
  style: "package" | "relative" | "deep";
  /**
   * Package name to use when style is "package".
   * Example: "@mylib/components"
   */
  packageName?: string;
  /**
   * When style is "relative", the path of the file doing the importing.
   * Used to compute relative import paths.
   */
  consumerPath?: string;
}

/**
 * Registry lookup finds symbols automatically, respects import preferences.
 */
export class SymbolRegistry {
  readonly #wellKnown = new Map<string, SymbolConfig>();
  readonly #projectSymbols = new Map<string, SymbolConfig>();
  readonly #fileSymbols = new Map<string, Set<string>>();

  constructor() {
    this.#registerRuntimeSymbols();
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
   * Applies import preference to project symbols if provided.
   */
  lookup(symbol: string, preference?: ImportPreference): SymbolConfig | null {
    const wellKnown = this.#wellKnown.get(symbol);
    if (wellKnown) {
      return wellKnown;
    }

    const project = this.#projectSymbols.get(symbol);
    if (project) {
      return preference
        ? this.#adaptToPreference(project, preference)
        : project;
    }

    return null;
  }

  /**
   * Get all registered symbols.
   */
  all(preference?: ImportPreference): SymbolConfig[] {
    return [
      ...Array.from(this.#wellKnown.values()),
      ...Array.from(this.#projectSymbols.values()).map((s) =>
        preference ? this.#adaptToPreference(s, preference) : s,
      ),
    ];
  }

  /**
   * Adapt module path based on import preference.
   * - "package": use packageName
   * - "relative": compute relative path from consumerPath to module
   * - "deep": use the full module path (file path)
   */
  #adaptToPreference(
    config: SymbolConfig,
    preference: ImportPreference,
  ): SymbolConfig {
    // Runtime symbols are never transformed
    if (config.module === "@pencel/runtime") {
      return config;
    }

    if (preference.style === "package" && preference.packageName) {
      return {
        ...config,
        module: preference.packageName,
      };
    }

    if (preference.style === "relative") {
      if (!preference.consumerPath) {
        throw new Error(
          `Import preference style "relative" requires consumerPath to be set`,
        );
      }

      const relativePath = getRelativeImportPath(
        preference.consumerPath,
        config.module,
      );
      return {
        ...config,
        module: relativePath,
      };
    }

    // "deep" style: use module path as-is
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
