/**
 * Loop context and index management for JSX transformation.
 * Handles .map() and .forEach() callback transformations with proper scoping.
 */

import type { Block, Node } from "typescript";
import { type Expression, factory, type ParameterDeclaration, SyntaxKind, visitEachChild } from "typescript";

/**
 * Tracks context for loop processing (parameter name and index variable)
 */
export interface LoopContext {
  paramName: string; // Name of loop parameter (e.g., "todo")
  indexName?: string; // Name of index variable if available (e.g., "index")
  needsIndex: boolean; // Whether we need to add index parameter to signature
  isRootElement: boolean; // Whether this element should use the key/index interpolation
  scopeKeyExpr?: Expression; // Scope key expression for hierarchical memoization (e.g., "todo.id" or "index")
}

/**
 * Manages loop context stack and detects index requirements
 */
export class LoopContextManager {
  #loopContextStack: LoopContext[] = [];

  /**
   * Push a loop context onto the stack
   */
  push(context: LoopContext): void {
    this.#loopContextStack.push(context);
  }

  /**
   * Pop the current loop context
   */
  pop(): LoopContext | undefined {
    return this.#loopContextStack.pop();
  }

  /**
   * Get the current loop context (if inside a loop)
   */
  getCurrent(): LoopContext | undefined {
    return this.#loopContextStack[this.#loopContextStack.length - 1];
  }

  /**
   * Get the current stack length (depth)
   */
  depth(): number {
    return this.#loopContextStack.length;
  }

  /**
   * Check if callback body has JSX elements without explicit keys.
   * If so, we need to add index parameter for stable memoization.
   */
  callbackNeedsIndexForKeys(body: Expression | Block): boolean {
    let hasElementWithoutKey = false;
    let isFirstElement = true;

    const checkNode = (node: Node): Node => {
      // Look for JSX elements
      if (node.kind === SyntaxKind.JsxElement || node.kind === SyntaxKind.JsxSelfClosingElement) {
        const jsxNode = node as unknown as {
          openingElement?: {
            attributes?: {
              properties?: Array<{
                kind: SyntaxKind;
                name?: { text: string };
              }>;
            };
          };
          tagName?: { text: string };
          kind: SyntaxKind;
          children?: Array<{ kind: SyntaxKind }>;
        };

        // Check if this element has a key prop
        const hasKey =
          jsxNode.openingElement?.attributes?.properties?.some(
            (attr) => attr.kind === SyntaxKind.JsxAttribute && attr.name?.text === "key",
          ) ?? false;

        // Check the root element itself first
        if (isFirstElement) {
          isFirstElement = false;

          // Root element without explicit key needs index
          if (!hasKey) {
            hasElementWithoutKey = true;
          }

          // Continue checking nested child elements
          if ("children" in jsxNode && jsxNode.children) {
            for (const child of jsxNode.children) {
              checkNode(child as Node);
            }
          }
        } else if (!hasKey) {
          // Found a non-root element without explicit key
          hasElementWithoutKey = true;
        }
        return node;
      }

      // Recursively visit children
      if (!hasElementWithoutKey) {
        return visitEachChild(node, checkNode, undefined);
      }
      return node;
    };

    checkNode(body as Node);
    return hasElementWithoutKey;
  }

  /**
   * Extract the JSX key prop from the first root element in the callback body.
   * Returns the key expression if found, otherwise null.
   */
  extractJsxKeyFromBody(body: Expression | Block): Expression | null {
    const checkNode = (node: Node): Expression | null => {
      if (node.kind === SyntaxKind.JsxElement || node.kind === SyntaxKind.JsxSelfClosingElement) {
        const jsxNode = node as unknown as {
          openingElement?: {
            attributes?: {
              properties?: Array<{
                kind: SyntaxKind;
                name?: { text: string };
                initializer?: {
                  kind: SyntaxKind;
                  expression?: Expression;
                };
              }>;
            };
          };
        };

        // Look for key prop in attributes
        if (jsxNode.openingElement?.attributes?.properties) {
          for (const attr of jsxNode.openingElement.attributes.properties) {
            if (attr.kind === SyntaxKind.JsxAttribute && attr.name?.text === "key") {
              if (attr.initializer?.kind === SyntaxKind.JsxExpression && attr.initializer.expression) {
                return attr.initializer.expression;
              }
            }
          }
        }
        // Return null after checking the first JSX element (don't traverse deeper)
        return null;
      }

      // For block bodies, check statements
      if (node.kind === SyntaxKind.Block) {
        const blockNode = node as unknown as {
          statements?: Array<{ kind: SyntaxKind }>;
        };
        if (blockNode.statements) {
          for (const stmt of blockNode.statements) {
            const result = checkNode(stmt as Node);
            if (result) return result;
          }
        }
        return null;
      }

      // For return/expression statements, check the expression
      if (node.kind === SyntaxKind.ReturnStatement || node.kind === SyntaxKind.ExpressionStatement) {
        const exprNode = node as unknown as { expression?: Expression };
        if (exprNode.expression) {
          return checkNode(exprNode.expression as unknown as Node);
        }
      }

      // For parenthesized expressions, unwrap
      if (node.kind === SyntaxKind.ParenthesizedExpression) {
        const parenNode = node as unknown as { expression: Expression };
        return checkNode(parenNode.expression as unknown as Node);
      }

      return null;
    };

    return checkNode(body as Node);
  }

  /**
   * Build hierarchical scope key by concatenating all PARENT loop context scope keys
   * (excluding the current/immediate loop level).
   * Returns a concatenated expression or null if no parent loop contexts.
   */
  buildHierarchicalScopeKey(): Expression | null {
    // Only include parent contexts, not the current one
    if (this.#loopContextStack.length <= 1) {
      return null;
    }

    // Collect all scope key expressions from parent contexts (all but the last one)
    const scopeKeys: Expression[] = [];
    for (let i = 0; i < this.#loopContextStack.length - 1; i++) {
      const context = this.#loopContextStack[i];
      if (context.scopeKeyExpr) {
        scopeKeys.push(context.scopeKeyExpr);
      }
    }

    if (scopeKeys.length === 0) {
      return null;
    }

    // Concatenate all parent scope keys with "_" separator
    let result = scopeKeys[0];

    // Add remaining keys
    for (let i = 1; i < scopeKeys.length; i++) {
      result = factory.createBinaryExpression(
        result,
        SyntaxKind.PlusToken,
        factory.createBinaryExpression(factory.createStringLiteral("_"), SyntaxKind.PlusToken, scopeKeys[i]),
      );
    }

    return result;
  }
}

/**
 * Transformer callback helper - reconstructs arrow function with transformed body
 */
export function updateLoopCallback(
  callback: Expression,
  transformedBody: Expression | Block,
  newParams: ParameterDeclaration[],
): Expression {
  return factory.updateArrowFunction(
    callback as unknown as Parameters<typeof factory.updateArrowFunction>[0],
    undefined,
    undefined,
    newParams,
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    transformedBody,
  );
}
