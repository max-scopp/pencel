import {
  type Expression,
  factory,
  type ObjectLiteralExpression,
  type PropertyAssignment,
} from "typescript";

interface RecordToObjectLiteralOptions {
  symbolNames?: Map<symbol, string>;
}

/**
 * Convert a plain JS object into a TypeScript AST ObjectLiteralExpression recursively
 * Supports string keys and Symbol keys (which become computed property names)
 *
 * @param obj - The object to convert
 * @param options - Configuration options
 * @param options.symbolNames - Map of symbols to their identifier names (e.g., INTERNALS)
 */
export function recordToObjectLiteral(
  obj: Record<string, unknown> | Record<symbol, unknown>,
  options?: RecordToObjectLiteralOptions,
): ObjectLiteralExpression {
  const properties: PropertyAssignment[] = [];
  const symbolNames = options?.symbolNames || new Map();

  // Handle both string and symbol keys
  for (const key of Object.getOwnPropertyNames(obj)) {
    properties.push(
      factory.createPropertyAssignment(
        factory.createStringLiteral(key),
        valueToExpression((obj as Record<string, unknown>)[key], options),
      ),
    );
  }

  // Handle symbol keys
  for (const key of Object.getOwnPropertySymbols(obj)) {
    const symbolName =
      symbolNames.get(key) || key.description || key.toString();
    properties.push(
      factory.createPropertyAssignment(
        factory.createComputedPropertyName(
          factory.createIdentifier(symbolName),
        ),
        valueToExpression((obj as Record<symbol, unknown>)[key], options),
      ),
    );
  }

  return factory.createObjectLiteralExpression(properties, true);
}

function valueToExpression(
  value: unknown,
  options?: RecordToObjectLiteralOptions,
): Expression {
  if (value === null) return factory.createNull();
  if (value === undefined) return factory.createIdentifier("undefined");
  if (typeof value === "string") return factory.createStringLiteral(value);
  if (typeof value === "number") return factory.createNumericLiteral(value);
  if (typeof value === "boolean")
    return value ? factory.createTrue() : factory.createFalse();
  if (Array.isArray(value)) {
    return factory.createArrayLiteralExpression(
      value.map((v) => valueToExpression(v, options)),
      false,
    );
  }
  if (typeof value === "object") {
    return recordToObjectLiteral(value as Record<string, unknown>, options);
  }

  throw new Error(`Unsupported value type: ${typeof value}`);
}
