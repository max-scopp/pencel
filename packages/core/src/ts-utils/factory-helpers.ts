/**
 * Generic AST/TypeScript factory helpers for cleaner code generation.
 * These are utility wrappers around TypeScript's factory API.
 */

import { type Block, type Expression, factory, type Statement, SyntaxKind } from "typescript";

/**
 * Create a call expression: fn(args...)
 */
export function createCall(func: Expression, args: Expression[]): Expression {
  return factory.createCallExpression(func, undefined, args);
}

/**
 * Create an arrow function: () => expr or () => { statements }
 */
export function createArrow(body: Expression | Block): Expression {
  return factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    body,
  );
}

/**
 * Create property access: obj.prop
 */
export function createPropAccess(obj: Expression, prop: string): Expression {
  return factory.createPropertyAccessExpression(obj, prop);
}

/**
 * Create expression statement
 */
export function createExprStmt(expr: Expression): Statement {
  return factory.createExpressionStatement(expr);
}

/**
 * Create element factory expression (dce call)
 */
export function createElementCreation(tagName: string): Expression {
  return createCall(factory.createIdentifier("dce"), [factory.createStringLiteral(tagName)]);
}

/**
 * Generate a new variable name with counter
 */
export class VarNameGenerator {
  #varCounter = 0;

  genVar(): string {
    const varName = `$${this.#varCounter}`;
    this.#varCounter++;
    return varName;
  }

  reset(): void {
    this.#varCounter = 0;
  }

  current(): number {
    return this.#varCounter;
  }

  increment(): void {
    this.#varCounter++;
  }
}
