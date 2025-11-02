import { dirname, relative } from "node:path";
import ts, { transform } from "typescript";

/**
 * Rewrite all import/export/module specifiers in a SourceFile.
 * Returns a new SourceFile.
 */
export function updateSourceFileImports(
  sf: ts.SourceFile,
  replacer: (oldSpec: string) => string | null | undefined,
  tsFactory = ts.factory,
): ts.SourceFile {
  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visitor: ts.Visitor = (node) => {
      // -------------------
      // import ... from "x"
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const newSpec = replacer(node.moduleSpecifier.text);
        if (typeof newSpec === "string" && newSpec !== node.moduleSpecifier.text) {
          return tsFactory.updateImportDeclaration(
            node,
            node.modifiers,
            node.importClause,
            tsFactory.createStringLiteral(newSpec),
            node.assertClause ?? undefined,
          );
        }
        return node;
      }

      // export ... from "x"
      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const newSpec = replacer(node.moduleSpecifier.text);
        if (typeof newSpec === "string" && newSpec !== node.moduleSpecifier.text) {
          return tsFactory.updateExportDeclaration(
            node,
            node.modifiers,
            node.isTypeOnly,
            node.exportClause,
            tsFactory.createStringLiteral(newSpec),
            node.assertClause,
          );
        }
        return node;
      }

      // import foo = require("x")
      if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference) &&
        ts.isStringLiteral(node.moduleReference.expression)
      ) {
        const newSpec = replacer(node.moduleReference.expression.text);
        if (typeof newSpec === "string" && newSpec !== node.moduleReference.expression.text) {
          const newRef = tsFactory.createExternalModuleReference(tsFactory.createStringLiteral(newSpec));
          return tsFactory.updateImportEqualsDeclaration(
            node,
            node.modifiers,
            node.isTypeOnly, // TS 5+ requires this boolean
            node.name,
            newRef,
          );
        }
        return node;
      }

      // dynamic import("x")
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length >= 1
      ) {
        const arg = node.arguments[0];
        if (ts.isStringLiteral(arg)) {
          const newSpec = replacer(arg.text);
          if (typeof newSpec === "string" && newSpec !== arg.text) {
            return tsFactory.updateCallExpression(node, node.expression, node.typeArguments, [
              tsFactory.createStringLiteral(newSpec),
              ...node.arguments.slice(1),
            ]);
          }
        }
        return node;
      }

      // require("x")
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "require" &&
        node.arguments.length >= 1
      ) {
        const arg = node.arguments[0];
        if (ts.isStringLiteral(arg)) {
          const newSpec = replacer(arg.text);
          if (typeof newSpec === "string" && newSpec !== arg.text) {
            return tsFactory.updateCallExpression(node, node.expression, node.typeArguments, [
              tsFactory.createStringLiteral(newSpec),
              ...node.arguments.slice(1),
            ]);
          }
        }
        return node;
      }

      // import type("x")
      if (
        ts.isImportTypeNode(node) &&
        node.argument &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      ) {
        const newSpec = replacer(node.argument.literal.text);
        if (typeof newSpec === "string" && newSpec !== node.argument.literal.text) {
          const newArg = tsFactory.createLiteralTypeNode(tsFactory.createStringLiteral(newSpec));
          return ts.factory.updateImportTypeNode(
            node,
            newArg,
            node.attributes,
            node.qualifier,
            node.typeArguments,
            node.isTypeOf,
          );
        }
        return node;
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return (rootNode) => {
      ts.visitNode(rootNode, visitor);
      return rootNode;
    };
  };

  const result = transform(sf, [transformer]);
  const transformed = result.transformed[0] as ts.SourceFile;
  result.dispose();
  return transformed;
}

/** Exact string replacement convenience */
export function updateSourceFileImportsExact(sf: ts.SourceFile, from: string, to: string): ts.SourceFile {
  return updateSourceFileImports(sf, (s) => (s === from ? to : null));
}

/** Compute relative module specifier string from file paths */
export function computeModuleSpecifierFor(fromFile: string, targetAbs: string): string {
  let rel = relative(dirname(fromFile), targetAbs).replace(/\\/g, "/");
  rel = rel.replace(/\.(ts|tsx|js|jsx)$/, "");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}
