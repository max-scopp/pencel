import {
  type Expression,
  factory,
  type ObjectLiteralExpression,
  type PropertyAssignment,
} from "typescript";

/**
 * Convert a plain JS object into a TypeScript AST ObjectLiteralExpression recursively
 */
export function recordToObjectLiteral(
  obj: Record<string, unknown>,
): ObjectLiteralExpression {
  const properties: PropertyAssignment[] = [];

  for (const [key, value] of Object.entries(obj)) {
    properties.push(
      factory.createPropertyAssignment(
        factory.createStringLiteral(key),
        valueToExpression(value),
      ),
    );
  }

  return factory.createObjectLiteralExpression(properties, true);
}

function valueToExpression(value: unknown): Expression {
  if (value === null) return factory.createNull();
  if (value === undefined) return factory.createIdentifier("undefined");
  if (typeof value === "string") return factory.createStringLiteral(value);
  if (typeof value === "number") return factory.createNumericLiteral(value);
  if (typeof value === "boolean")
    return value ? factory.createTrue() : factory.createFalse();
  if (Array.isArray(value)) {
    return factory.createArrayLiteralExpression(
      value.map(valueToExpression),
      false,
    );
  }
  if (typeof value === "object") {
    return recordToObjectLiteral(value as Record<string, unknown>);
  }

  throw new Error(`Unsupported value type: ${typeof value}`);
}
