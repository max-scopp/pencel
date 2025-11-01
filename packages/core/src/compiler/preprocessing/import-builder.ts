import { inject } from "../core/container.ts";
import { SymbolRegistry } from "./symbol-registry.ts";

export interface ImportRequirement {
  symbols: string[];
  from: string;
  importStyle?: "named" | "default";
  isType?: boolean;
}

/**
 * Converts collected symbols into import requirements via registry lookup.
 */
export class ImportBuilder {
  readonly #registry = inject(SymbolRegistry);

  /**
   * Build import requirements for symbols.
   * Groups by module, deduplicates, skips unknown symbols.
   */
  build(symbols: Set<string>): ImportRequirement[] {
    const requirements = new Map<string, ImportRequirement>();

    for (const symbol of symbols) {
      const config = this.#registry.lookup(symbol);

      if (!config) {
        continue;
      }

      const key = config.module;

      if (!requirements.has(key)) {
        requirements.set(key, {
          symbols: [],
          from: config.module,
          importStyle: config.importStyle,
          isType: config.isType,
        });
      }

      const req = requirements.get(key)!;

      if (!req.symbols.includes(symbol)) {
        req.symbols.push(symbol);
      }
    }

    for (const req of requirements.values()) {
      req.symbols.sort();
    }

    return Array.from(requirements.values());
  }
}

