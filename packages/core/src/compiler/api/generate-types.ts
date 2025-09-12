import * as ts from "typescript";
import type { PencilConfig } from "../types/compiler-types";
import { createSourceFile } from "../utils/ast-utils";

/**
 * Generates TypeScript window interface declarations for web components
 * based on @Component decorators found in the file content.
 */
export function generateTypes(
  fileContent: string,
  pencilConfig?: PencilConfig,
): string {
  const sourceFile = createSourceFile(fileContent);
  const componentTags: string[] = [];

  // Find all classes with @Component decorators
  function findAllComponents(node: ts.Node): void {
    if (ts.isClassDeclaration(node) && hasComponentDecorator(node)) {
      const tagName = extractTagName(node);
      if (tagName) {
        // Apply tagNamespace from config if present
        const finalTagName = pencilConfig?.tagNamespace
          ? `${pencilConfig.tagNamespace}${tagName}`
          : tagName;
        componentTags.push(finalTagName);
      }
    }
    ts.forEachChild(node, findAllComponents);
  }

  findAllComponents(sourceFile);

  if (componentTags.length === 0) {
    return "";
  }

  // Generate TypeScript interface declarations
  const interfaceDeclarations = componentTags
    .map((tag) => `    "${tag}": ${getElementType(tag)};`)
    .join("\n");

  return `declare global {
  interface Window {
${interfaceDeclarations}
  }
}`;
}

function hasComponentDecorator(node: ts.ClassDeclaration): boolean {
  const decorators = ts.getDecorators(node);
  if (!decorators) return false;

  return decorators.some((decorator) => {
    if (ts.isCallExpression(decorator.expression)) {
      const expression = decorator.expression.expression;
      if (ts.isIdentifier(expression)) {
        return expression.text === "Component";
      }
    }
    return false;
  });
}

function extractTagName(node: ts.ClassDeclaration): string | null {
  const decorators = ts.getDecorators(node);
  if (!decorators) return null;

  for (const decorator of decorators) {
    if (ts.isCallExpression(decorator.expression)) {
      const expression = decorator.expression.expression;
      if (ts.isIdentifier(expression) && expression.text === "Component") {
        const args = decorator.expression.arguments;
        if (args.length > 0 && ts.isObjectLiteralExpression(args[0])) {
          const obj = args[0];
          for (const prop of obj.properties) {
            if (
              ts.isPropertyAssignment(prop) &&
              ts.isIdentifier(prop.name) &&
              prop.name.text === "tagName" &&
              ts.isStringLiteral(prop.initializer)
            ) {
              return prop.initializer.text;
            }
          }
        }
      }
    }
  }

  // Fallback to class name if no explicit tagName
  if (node.name) {
    return node.name.text.toLowerCase();
  }

  return null;
}

function getElementType(tagName: string): string {
  // Simple heuristic: if tag ends with '-button', assume it's a button element
  if (tagName.includes("button")) {
    return "HTMLButtonElement";
  }
  // Default to HTMLElement for other custom elements
  return "HTMLElement";
}
