import {
  forEachChild,
  type Identifier,
  isClassDeclaration,
  isExportSpecifier,
  isFunctionDeclaration,
  isIdentifier,
  isImportDeclaration,
  isImportSpecifier,
  isNamedImports,
  isNamespaceImport,
  isParameter,
  isPropertyDeclaration,
  isVariableDeclaration,
  type Node,
  type SourceFile,
} from "typescript";

export class SymbolCollector {
  static readonly #BUILTINS = new Set([
    "undefined",
    "null",
    "true",
    "false",
    "this",
    "super",
    "console",
    "window",
    "document",
    "Object",
    "Array",
    "String",
    "Number",
    "Boolean",
    "Symbol",
    "Map",
    "Set",
    "Promise",
    "Error",
  ]);

  /**
   * Collect identifier references that could need imports.
   */
  collect(sourceFile: SourceFile): Set<string> {
    const symbols = new Set<string>();
    const existingImports = this.#extractExistingImports(sourceFile);
    const exportSpecifierSymbols =
      this.#extractExportSpecifierSymbols(sourceFile);
    const importSpecifierSymbols =
      this.#extractImportSpecifierSymbols(sourceFile);

    const visit = (node: Node): void => {
      if (isIdentifier(node)) {
        const text = node.text;

        if (
          existingImports.has(text) ||
          exportSpecifierSymbols.has(text) ||
          importSpecifierSymbols.has(text) ||
          SymbolCollector.#BUILTINS.has(text) ||
          this.#isDeclaration(node)
        ) {
          return;
        }

        symbols.add(text);
      }

      forEachChild(node, visit);
    };

    visit(sourceFile);
    return symbols;
  }

  /**
   * Extract already-imported symbols from file.
   */
  #extractExistingImports(sourceFile: SourceFile): Set<string> {
    const imports = new Set<string>();

    forEachChild(sourceFile, (node) => {
      if (isImportDeclaration(node) && node.importClause) {
        const clause = node.importClause;

        if (clause.name) {
          imports.add(clause.name.text);
        }

        if (clause.namedBindings && isNamedImports(clause.namedBindings)) {
          clause.namedBindings.elements.forEach((el) => {
            imports.add(el.name.text);
          });
        }

        if (clause.namedBindings && isNamespaceImport(clause.namedBindings)) {
          imports.add(clause.namedBindings.name.text);
        }
      }
    });

    return imports;
  }

  /**
   * Extract symbols from export specifiers (e.g., `export { Symbol }`).
   */
  #extractExportSpecifierSymbols(sourceFile: SourceFile): Set<string> {
    const symbols = new Set<string>();

    const visit = (node: Node): void => {
      if (isExportSpecifier(node)) {
        symbols.add(node.name.text);
      }
      forEachChild(node, visit);
    };

    visit(sourceFile);
    return symbols;
  }

  /**
   * Extract symbols from import specifiers (e.g., `import { Symbol } from ...`).
   */
  #extractImportSpecifierSymbols(sourceFile: SourceFile): Set<string> {
    const symbols = new Set<string>();

    const visit = (node: Node): void => {
      if (isImportSpecifier(node)) {
        symbols.add(node.name.text);
      }
      forEachChild(node, visit);
    };

    visit(sourceFile);
    return symbols;
  }

  /**
   * Check if identifier is part of a declaration (being defined), export, or import.
   */
  #isDeclaration(identifier: Identifier): boolean {
    const parent = identifier.parent;

    if (!parent) {
      return false;
    }

    if (isVariableDeclaration(parent) && parent.name === identifier) {
      return true;
    }

    if (isFunctionDeclaration(parent) && parent.name === identifier) {
      return true;
    }

    if (isClassDeclaration(parent) && parent.name === identifier) {
      return true;
    }

    if (isParameter(parent) && parent.name === identifier) {
      return true;
    }

    if (isPropertyDeclaration(parent) && parent.name === identifier) {
      return true;
    }

    // Skip identifiers in export specifiers (e.g., `export { Symbol }`)
    if (isExportSpecifier(parent)) {
      return true;
    }

    // Skip identifiers in import specifiers (e.g., `import { Symbol } from ...`)
    if (isImportSpecifier(parent)) {
      return true;
    }

    return false;
  }
}
