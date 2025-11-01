import { inject } from "../core/container.ts";
import { type ImportPreference, SymbolRegistry } from "./symbol-registry.ts";

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
   * Applies import preference if provided.
   */
  build(
    symbols: Set<string>,
    preference?: ImportPreference,
  ): ImportRequirement[] {
    const requirements = new Map<string, ImportRequirement>();

    for (const symbol of symbols) {
      const config = this.#registry.lookup(symbol, preference);

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

      const req = requirements.get(key);
      if (req && !req.symbols.includes(symbol)) {
        req.symbols.push(symbol);
      }
    }

    for (const req of requirements.values()) {
      req.symbols.sort();
    }

    return Array.from(requirements.values());
  }
}
