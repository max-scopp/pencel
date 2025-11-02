import {
  type Expression,
  isArrayLiteralExpression,
  isArrowFunction,
  isFunctionExpression,
  isIdentifier,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isShorthandPropertyAssignment,
  isSpreadAssignment,
  isStringLiteral,
  type ObjectLiteralExpression,
  type PropertyName,
  SyntaxKind,
} from "typescript";
import { serializeNode } from "./node.ts";

/**
 * Convert a TypeScript ObjectLiteralExpression into a plain JS object recursively,
 * where functions/arrows are converted to ASTNode.
 */
export function objectLiteralToRecord(obj: ObjectLiteralExpression): Record<string, any> {
  const result: Record<string, any> = {};

  for (const prop of obj.properties) {
    if (isPropertyAssignment(prop)) {
      const key = getPropName(prop.name);
      result[key] = extractValue(prop.initializer);
    } else if (isShorthandPropertyAssignment(prop)) {
      const key = prop.name.text;
      result[key] = key;
    } else if (isSpreadAssignment(prop)) {
      const spreadVal = prop.expression;
      if (isObjectLiteralExpression(spreadVal)) {
        Object.assign(result, objectLiteralToRecord(spreadVal));
      } else {
        result[prop.getText()] = extractValue(spreadVal);
      }
    }
  }

  return result;
}

function getPropName(name: PropertyName): string {
  if (isIdentifier(name) || isStringLiteral(name) || isNumericLiteral(name)) {
    return name.text;
  }
  return name.getText();
}

/**
 * Convert any Expression to a portable JS value:
 * - Object literals → recursively converted
 * - Arrays → recursively converted
 * - Functions/arrows → ASTNode (never null)
 * - Primitives → JS primitives
 * - Fallback → expression text
 */
export function extractValue(expr: Expression): any {
  if (isObjectLiteralExpression(expr)) return objectLiteralToRecord(expr);
  if (isArrayLiteralExpression(expr)) return expr.elements.map(extractValue);
  if (isArrowFunction(expr) || isFunctionExpression(expr)) return serializeNode(expr);
  if (isStringLiteral(expr)) return expr.text;
  if (isNumericLiteral(expr)) return Number(expr.text);
  if (expr.kind === SyntaxKind.TrueKeyword) return true;
  if (expr.kind === SyntaxKind.FalseKeyword) return false;
  if (expr.kind === SyntaxKind.NullKeyword) return null;
  return expr.getText(); // fallback
}
