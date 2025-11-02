/**
 * JSX element transformation logic.
 * Handles conversion of JSX elements and self-closing elements to zero-dom code.
 */

import {
  type Expression,
  factory,
  type JsxElement,
  type JsxSelfClosingElement,
  NodeFlags,
  type Statement,
  SyntaxKind,
  visitEachChild,
} from "typescript";
import {
  createArrow,
  createCall,
  createElementCreation,
  createExprStmt,
  createPropAccess,
  type VarNameGenerator,
} from "../../ts-utils/factory-helpers.ts";
import { inject } from "../core/container.ts";
import { Plugins } from "../core/plugin.ts";
import type { LoopContext } from "./render.loop.ts";

/**
 * Handles JSX element and self-closing element transformation.
 * Normalizes both element types and applies memoization/caching.
 */
export class JsxTransformer {
  #varGenerator: VarNameGenerator;
  #prependStatements: Statement[] = [];
  #plugins = inject(Plugins);

  constructor(varGenerator: VarNameGenerator) {
    this.#varGenerator = varGenerator;
  }

  /**
   * Set prepend statements for this transformer
   */
  setPrependStatements(statements: Statement[]): void {
    this.#prependStatements = statements;
  }

  /**
   * Get prepend statements from this transformer
   */
  getPrependStatements(): Statement[] {
    return this.#prependStatements;
  }

  /**
   * Transform a JSX element or self-closing element into zero-dom code.
   * Normalizes both types and handles attributes, children, and memoization keys.
   */
  transformJsxElement(
    jsx: JsxElement | JsxSelfClosingElement,
    loopContext: LoopContext | undefined,
    hierarchicalScopeKey: Expression | null,
    transformExpression: (expr: Expression) => Expression,
  ): Expression {
    const varName = this.#varGenerator.genVar();
    const isElement = jsx.kind === SyntaxKind.JsxElement;
    const elementData = this.#extractElementData(jsx);
    const tagName = elementData.tagName;

    // Extract and remove key from attributes
    const { keyExpr, remainingAttrs } = this.#extractKeyFromJsx(
      elementData.attributes,
    );
    elementData.attributes = remainingAttrs;

    // Build memoization key
    const cmcKey = this.#buildCmcKey(
      tagName,
      varName,
      loopContext,
      hierarchicalScopeKey,
      keyExpr,
    );

    // Create element with memoization
    const createExpr = createElementCreation(tagName);
    const onceCall = createCall(
      createPropAccess(factory.createIdentifier("this"), "#cmc"),
      [cmcKey, createArrow(createExpr)],
    );

    // Add element creation statement
    this.#prependStatements.push(
      factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              varName,
              undefined,
              undefined,
              onceCall as unknown as Expression,
            ),
          ],
          NodeFlags.Let,
        ),
      ),
    );

    // Set attributes
    this.#handleAttributes(varName, elementData.attributes);

    // Handle children only for JsxElement (not self-closing)
    if (isElement) {
      const childrenExpressions = this.#handleChildren(
        jsx as JsxElement,
        varName,
        loopContext,
        hierarchicalScopeKey,
        transformExpression,
      );

      if (childrenExpressions.length > 0) {
        this.#prependStatements.push(
          createExprStmt(
            createCall(factory.createIdentifier("sc"), [
              factory.createIdentifier(varName),
              factory.createArrayLiteralExpression(childrenExpressions),
            ]),
          ),
        );
      }
    }

    return factory.createIdentifier(varName);
  }

  /**
   * Transform children of a custom component.
   * Calls plugin hooks to allow custom transformations before falling back to default behavior.
   */
  transformCustomComponent(
    jsx: JsxElement,
    loopContext: LoopContext | undefined,
    hierarchicalScopeKey: Expression | null,
    transformExpression: (expr: Expression) => Expression,
  ): Expression {
    const openingElement = (
      jsx as unknown as {
        openingElement: {
          tagName: { text: string };
          attributes: { properties?: unknown };
        };
      }
    ).openingElement;
    const tagName = openingElement.tagName.text;
    const attributes = openingElement.attributes.properties;

    const hook = {
      hook: "jsx:transform" as const,
      tagName,
      attributes,
      jsxNode: jsx,
      loopContext,
      hierarchicalScopeKey,
      transformExpression,
      prependStatements: this.#prependStatements,
      result: undefined as Expression | undefined,
    };

    this.#plugins.handleSync(hook);

    if (hook.result) {
      return hook.result;
    }

    // Fallback: recursively visit children for unknown custom components
    return visitEachChild(
      jsx as unknown as Expression,
      (node) => {
        if (
          node.kind === SyntaxKind.JsxElement ||
          node.kind === SyntaxKind.JsxSelfClosingElement
        ) {
          return transformExpression(
            node as Expression,
          ) as unknown as typeof node;
        }
        if (node.kind === SyntaxKind.JsxExpression) {
          const expr = (node as unknown as { expression?: Expression })
            .expression;
          if (expr) {
            const transformed = transformExpression(expr);
            return factory.updateJsxExpression(
              node as unknown as Parameters<
                typeof factory.updateJsxExpression
              >[0],
              transformed,
            );
          }
        }
        return node;
      },
      undefined,
    ) as Expression;
  }

  /**
   * Extract JSX element or self-closing element data
   */
  #extractElementData(jsx: JsxElement | JsxSelfClosingElement): {
    tagName: string;
    attributes: unknown;
  } {
    if (jsx.kind === SyntaxKind.JsxElement) {
      const elem = jsx as unknown as {
        openingElement: {
          tagName: { text: string };
          attributes: { properties?: unknown };
        };
      };
      return {
        tagName: elem.openingElement.tagName.text || "div",
        attributes: elem.openingElement.attributes.properties,
      };
    } else {
      const elem = jsx as unknown as {
        tagName: { text: string };
        attributes: { properties?: unknown };
      };
      return {
        tagName: elem.tagName.text || "div",
        attributes: elem.attributes.properties,
      };
    }
  }

  /**
   * Build memoization cache key (cmc key) with hierarchical scope
   */
  #buildCmcKey(
    tagName: string,
    _varName: string,
    loopContext: LoopContext | undefined,
    hierarchicalScopeKey: Expression | null,
    keyExpr: Expression | null,
  ): Expression {
    const baseKey = `${tagName}_${this.#varGenerator.current() - 1}`;

    if (loopContext?.isRootElement) {
      // Mark this as no longer the root for subsequent sibling elements
      loopContext.isRootElement = false;

      let key: Expression = factory.createStringLiteral(`${baseKey}_`);

      if (hierarchicalScopeKey) {
        // We have parent scopes - add them first
        key = factory.createBinaryExpression(
          key,
          SyntaxKind.PlusToken,
          hierarchicalScopeKey,
        );

        // Then add the element's own key/scope
        if (keyExpr) {
          key = factory.createBinaryExpression(
            key,
            SyntaxKind.PlusToken,
            factory.createBinaryExpression(
              factory.createStringLiteral("_"),
              SyntaxKind.PlusToken,
              keyExpr,
            ),
          );
        } else if (loopContext.scopeKeyExpr) {
          key = factory.createBinaryExpression(
            key,
            SyntaxKind.PlusToken,
            factory.createBinaryExpression(
              factory.createStringLiteral("_"),
              SyntaxKind.PlusToken,
              loopContext.scopeKeyExpr,
            ),
          );
        }
      } else {
        // No parent scopes - just use explicit key or current scope
        if (keyExpr) {
          key = factory.createBinaryExpression(
            key,
            SyntaxKind.PlusToken,
            keyExpr,
          );
        } else if (loopContext.scopeKeyExpr) {
          key = factory.createBinaryExpression(
            key,
            SyntaxKind.PlusToken,
            loopContext.scopeKeyExpr,
          );
        } else if (loopContext.indexName) {
          key = factory.createBinaryExpression(
            key,
            SyntaxKind.PlusToken,
            factory.createIdentifier(loopContext.indexName),
          );
        }
      }

      return key;
    } else {
      // Child element in loop - use hierarchical scope for uniqueness
      if (hierarchicalScopeKey) {
        return factory.createBinaryExpression(
          factory.createStringLiteral(`${baseKey}_`),
          SyntaxKind.PlusToken,
          hierarchicalScopeKey,
        );
      } else if (loopContext?.scopeKeyExpr) {
        return factory.createBinaryExpression(
          factory.createStringLiteral(`${baseKey}_`),
          SyntaxKind.PlusToken,
          loopContext.scopeKeyExpr,
        );
      } else {
        return factory.createStringLiteral(baseKey);
      }
    }
  }

  /**
   * Handle JSX attributes - both static and dynamic
   */
  #handleAttributes(varName: string, attributes: unknown): void {
    const attrs = attributes as Array<{
      kind: SyntaxKind;
      name?: { text: string };
      initializer?: {
        kind: SyntaxKind;
        text?: string;
        expression?: Expression;
      };
    }>;

    if (!Array.isArray(attrs)) return;

    for (const attr of attrs) {
      if (attr.kind === SyntaxKind.JsxAttribute && attr.name) {
        const attrName = attr.name.text;

        // Check if this is an event handler (starts with "on")
        if (attrName.startsWith("on")) {
          const eventName = attrName.slice(2).toLowerCase(); // onClick -> click

          if (attr.initializer?.kind === SyntaxKind.JsxExpression) {
            const exprNode = attr.initializer.expression;
            if (exprNode) {
              this.#prependStatements.push(
                createExprStmt(
                  createCall(factory.createIdentifier("ael"), [
                    factory.createIdentifier(varName),
                    factory.createStringLiteral(eventName),
                    exprNode,
                  ]),
                ),
              );
            }
          }
        } else {
          // Regular attribute
          if (!attr.initializer) {
            // Boolean attribute like <input disabled />
            this.#prependStatements.push(
              createExprStmt(
                createCall(factory.createIdentifier("sp"), [
                  factory.createIdentifier(varName),
                  factory.createObjectLiteralExpression([
                    factory.createPropertyAssignment(
                      factory.createStringLiteral(attrName),
                      factory.createStringLiteral(""),
                    ),
                  ]),
                ]),
              ),
            );
          } else if (attr.initializer.kind === SyntaxKind.StringLiteral) {
            // Static string attribute: class="foo"
            const attrValue = attr.initializer.text || "";
            this.#prependStatements.push(
              createExprStmt(
                createCall(factory.createIdentifier("sp"), [
                  factory.createIdentifier(varName),
                  factory.createObjectLiteralExpression([
                    factory.createPropertyAssignment(
                      factory.createStringLiteral(attrName),
                      factory.createStringLiteral(attrValue),
                    ),
                  ]),
                ]),
              ),
            );
          } else if (attr.initializer.kind === SyntaxKind.JsxExpression) {
            // Dynamic attribute: class={expression}
            const exprNode = attr.initializer.expression;
            if (exprNode) {
              this.#prependStatements.push(
                createExprStmt(
                  createCall(factory.createIdentifier("sp"), [
                    factory.createIdentifier(varName),
                    factory.createObjectLiteralExpression([
                      factory.createPropertyAssignment(
                        factory.createStringLiteral(attrName),
                        exprNode,
                      ),
                    ]),
                  ]),
                ),
              );
            }
          }
        }
      }
    }
  }

  /**
   * Handle children of a JSX element
   */
  #handleChildren(
    jsx: JsxElement,
    varName: string,
    loopContext: LoopContext | undefined,
    hierarchicalScopeKey: Expression | null,
    transformExpression: (expr: Expression) => Expression,
  ): Expression[] {
    const children: Expression[] = [];
    const jsxWithChildren = jsx as unknown as {
      children?: Array<{
        kind: SyntaxKind;
        text?: string;
        expression?: Expression;
      }>;
    };

    if (!jsxWithChildren.children || jsxWithChildren.children.length === 0) {
      return children;
    }

    for (let i = 0; i < jsxWithChildren.children.length; i++) {
      const child = jsxWithChildren.children[i];
      if (!child) continue;

      if (child.kind === SyntaxKind.JsxText) {
        const text = child.text || "";
        if (text.trim()) {
          const textExpr = this.#createTextNode(
            varName,
            text,
            loopContext,
            hierarchicalScopeKey,
          );
          children.push(textExpr);
        }
      } else if (child.kind === SyntaxKind.JsxExpression) {
        const exprNode = child.expression;
        if (exprNode) {
          const transformed = transformExpression(exprNode);
          children.push(transformed);
        }
      } else if (
        child.kind === SyntaxKind.JsxElement ||
        child.kind === SyntaxKind.JsxSelfClosingElement
      ) {
        const transformed = transformExpression(child as unknown as Expression);
        children.push(transformed);
      }
    }

    return children;
  }

  /**
   * Create a text node with proper memoization key
   */
  #createTextNode(
    parentVarName: string,
    text: string,
    loopContext: LoopContext | undefined,
    hierarchicalScopeKey: Expression | null,
  ): Expression {
    const baseTextKey = `${parentVarName}_text_${this.#varGenerator.current()}`;
    this.#varGenerator.increment();

    let textKey: Expression;

    if (loopContext?.scopeKeyExpr) {
      if (hierarchicalScopeKey) {
        // Parent scopes exist - combine with current scope
        textKey = factory.createBinaryExpression(
          factory.createStringLiteral(`${baseTextKey}_`),
          SyntaxKind.PlusToken,
          factory.createBinaryExpression(
            hierarchicalScopeKey,
            SyntaxKind.PlusToken,
            factory.createBinaryExpression(
              factory.createStringLiteral("_"),
              SyntaxKind.PlusToken,
              loopContext.scopeKeyExpr,
            ),
          ),
        );
      } else {
        textKey = factory.createBinaryExpression(
          factory.createStringLiteral(`${baseTextKey}_`),
          SyntaxKind.PlusToken,
          loopContext.scopeKeyExpr,
        );
      }
    } else {
      textKey = factory.createStringLiteral(baseTextKey);
    }

    const textVarName = `${parentVarName}_text_${this.#varGenerator.current() - 1}`;
    const textOnce = createCall(
      createPropAccess(factory.createIdentifier("this"), "#cmc"),
      [
        textKey,
        createArrow(
          createCall(factory.createIdentifier("dctn"), [
            factory.createStringLiteral(text),
          ]),
        ),
      ],
    );

    this.#prependStatements.push(
      factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              textVarName,
              undefined,
              undefined,
              textOnce as unknown as Expression,
            ),
          ],
          NodeFlags.Let,
        ),
      ),
    );

    return factory.createIdentifier(textVarName);
  }

  /**
   * Extract the 'key' prop from JSX attributes
   */
  #extractKeyFromJsx(attributes: unknown): {
    keyExpr: Expression | null;
    remainingAttrs: unknown;
  } {
    const attrs = attributes as Array<{
      kind: SyntaxKind;
      name?: { text: string };
      initializer?: {
        kind: SyntaxKind;
        expression?: Expression;
      };
    }>;

    if (!Array.isArray(attrs)) {
      return { keyExpr: null, remainingAttrs: attributes };
    }

    let keyExpr: Expression | null = null;
    const remainingAttrs = attrs.filter((attr) => {
      if (attr.kind === SyntaxKind.JsxAttribute && attr.name?.text === "key") {
        if (
          attr.initializer?.kind === SyntaxKind.JsxExpression &&
          attr.initializer.expression
        ) {
          keyExpr = attr.initializer.expression;
        }
        return false; // Remove key attribute
      }
      return true;
    });

    return { keyExpr, remainingAttrs };
  }
}
