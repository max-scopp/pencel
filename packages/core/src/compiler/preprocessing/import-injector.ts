import {
  factory,
  type ImportDeclaration,
  isImportDeclaration,
  isNamedImports,
  isStringLiteral,
  type SourceFile,
} from "typescript";
import type { ImportRequirement } from "./import-builder.ts";

/**
 * Injects or merges imports into AST, deduplicating across modules.
 */
export class ImportInjector {
  /**
   * Add or merge imports into source file.
   */
  injectImports(
    sourceFile: SourceFile,
    requirements: ImportRequirement[],
  ): SourceFile {
    if (requirements.length === 0) {
      return sourceFile;
    }

    const existingImports = this.#extractImports(sourceFile);
    const otherStatements = sourceFile.statements.filter(
      (stmt) => !isImportDeclaration(stmt),
    );

    const mergedImports = this.#mergeImports(existingImports, requirements);
    const newStatements = [...mergedImports, ...otherStatements];

    return factory.updateSourceFile(sourceFile, newStatements);
  }

  /**
   * Extract all import declarations from source file.
   */
  #extractImports(sourceFile: SourceFile): ImportRequirement[] {
    const imports: ImportRequirement[] = [];

    for (const stmt of sourceFile.statements) {
      if (isImportDeclaration(stmt)) {
        const req = this.#parseImportDeclaration(stmt);
        if (req) {
          imports.push(req);
        }
      }
    }

    return imports;
  }

  /**
   * Parse import declaration into requirement.
   */
  #parseImportDeclaration(stmt: ImportDeclaration): ImportRequirement | null {
    if (!stmt.moduleSpecifier || !isStringLiteral(stmt.moduleSpecifier)) {
      return null;
    }

    const from = stmt.moduleSpecifier.text;
    const symbols: string[] = [];

    if (
      stmt.importClause?.namedBindings &&
      isNamedImports(stmt.importClause.namedBindings)
    ) {
      stmt.importClause.namedBindings.elements.forEach((el) => {
        symbols.push(el.name.text);
      });
    }

    return {
      symbols,
      from,
      importStyle: "named",
    };
  }

  /**
   * Merge new requirements with existing, returning deduplicated declarations.
   */
  #mergeImports(
    existingImports: ImportRequirement[],
    newRequirements: ImportRequirement[],
  ): ImportDeclaration[] {
    const importsByModule = new Map<string, Set<string>>();

    for (const req of existingImports) {
      const key = req.from;
      if (!importsByModule.has(key)) {
        importsByModule.set(key, new Set());
      }

      for (const symbol of req.symbols) {
        importsByModule.get(key)!.add(symbol);
      }
    }

    for (const req of newRequirements) {
      const key = req.from;
      if (!importsByModule.has(key)) {
        importsByModule.set(key, new Set());
      }

      for (const symbol of req.symbols) {
        importsByModule.get(key)!.add(symbol);
      }
    }

    const imports: ImportDeclaration[] = [];

    for (const [from, symbols] of importsByModule) {
      const sortedSymbols = Array.from(symbols).sort();

      const importElements = sortedSymbols.map((symbol) =>
        factory.createImportSpecifier(
          false,
          undefined,
          factory.createIdentifier(symbol),
        ),
      );

      const importDecl = factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports(importElements),
        ),
        factory.createStringLiteral(from),
      );

      imports.push(importDecl);
    }

    return imports;
  }
}
