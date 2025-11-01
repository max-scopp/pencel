import {
  type HasModifiers,
  isClassDeclaration,
  isEnumDeclaration,
  isFunctionDeclaration,
  isIdentifier,
  isInterfaceDeclaration,
  isTypeAliasDeclaration,
  isVariableStatement,
  type ModifierLike,
  type SourceFile,
  SyntaxKind,
} from "typescript";

/**
 * Extract all exported symbol names from a SourceFile (classes, interfaces, types, functions, etc.).
 */
export function extractExportedSymbols(sourceFile: SourceFile): Set<string> {
  const exported = new Set<string>();

  for (const statement of sourceFile.statements) {
    const hasModifiers = "modifiers" in statement;

    const modifiers = hasModifiers
      ? (statement as HasModifiers).modifiers
      : undefined;

    const hasExport =
      modifiers?.some(
        (m: ModifierLike) => m.kind === SyntaxKind.ExportKeyword,
      ) ?? false;

    if (!hasExport) {
      continue;
    }

    if (isClassDeclaration(statement) && statement.name) {
      exported.add(statement.name.text);
    } else if (isInterfaceDeclaration(statement) && statement.name) {
      exported.add(statement.name.text);
    } else if (isTypeAliasDeclaration(statement) && statement.name) {
      exported.add(statement.name.text);
    } else if (isFunctionDeclaration(statement) && statement.name) {
      exported.add(statement.name.text);
    } else if (isEnumDeclaration(statement) && statement.name) {
      exported.add(statement.name.text);
    } else if (isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (isIdentifier(decl.name)) {
          exported.add(decl.name.text);
        }
      }
    }
  }

  return exported;
}
