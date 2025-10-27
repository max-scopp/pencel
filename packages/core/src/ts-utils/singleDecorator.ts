import { throwError } from "@pencel/utils";
import {
  type Decorator,
  getDecorators,
  type HasDecorators,
  isCallExpression,
  isIdentifier,
} from "typescript";

/**
 * Require the first decorator on the node that matches the given name.
 */
export function singleDecorator(node: HasDecorators, name: string): Decorator {
  const decorators = getDecorators(node);

  if (!decorators) {
    throw new Error(
      `Cannot find @${name}, node ${node.getText()} has no decorators.`,
    );
  }

  return (
    decorators.find((decorator) => {
      const expr = decorator.expression;

      if (isCallExpression(expr)) {
        const fn = expr.expression;
        return isIdentifier(fn) && fn.text === name;
      } else if (isIdentifier(expr)) {
        return expr.text === name;
      }

      return false;
    }) ?? throwError(`Decorator @${name} not found.`)
  );
}
