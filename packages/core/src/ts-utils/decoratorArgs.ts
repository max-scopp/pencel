import ts, { type Decorator } from "typescript";
import { extractValue } from "./objectLiteralToRecord.ts";
import type { ASTArgsFrom } from "./types.ts";

/**
 * Convert any decorator argument into a plain JS value:
 * object literals → records, arrays → arrays, literals → JS values,
 * fallback → expression text.
 */
export function decoratorArgs<TArgs extends readonly unknown[]>(
  decorator: Decorator | undefined,
): ASTArgsFrom<TArgs> | undefined {
  if (!decorator) return;

  if (ts.isCallExpression(decorator.expression)) {
    return decorator.expression.arguments.map(extractValue) as ASTArgsFrom<TArgs>;
  }

  return;
}
