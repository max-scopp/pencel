import {
  forEachChild,
  type Identifier,
  isClassDeclaration,
  isFunctionDeclaration,
  isIdentifier,
  isImportDeclaration,
  isNamedImports,
  isNamespaceImport,
  isParameter,
  isPropertyDeclaration,
  isVariableDeclaration,
  type Node,
  type SourceFile,
} from "typescript";

export class SymbolCollector {
  /**
   * Collect identifier references that could need imports.
   */
  collect(sourceFile: SourceFile): Set<string> {
    const symbols = new Set<string>();
    const existingImports = this.#extractExistingImports(sourceFile);

    const visit = (node: Node): void => {
      if (isIdentifier(node)) {
        const text = node.text;

        if (
          existingImports.has(text) ||
          this.#isBuiltinOrKeyword(text) ||
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
   * Check if identifier is a built-in global or TypeScript keyword.
   */
  #isBuiltinOrKeyword(text: string): boolean {
    const builtins = new Set([
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

    return builtins.has(text);
  }

  /**
   * Check if identifier is part of a declaration (being defined).
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

    return false;
  }
}
