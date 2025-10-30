import {
  type Block,
  type Expression,
  factory,
  isReturnStatement,
  type JsxElement,
  type JsxSelfClosingElement,
  type MethodDeclaration,
  type Node,
  NodeFlags,
  type ParameterDeclaration,
  type Statement,
  SyntaxKind,
  visitEachChild,
} from "typescript";
import type { IRRef } from "../ir/irri.ts";
import { RenderIR } from "../ir/render.ts";
import { Transformer } from "./transformer.ts";

/**
 * Tracks context for loop processing (parameter name and index variable)
 */
interface LoopContext {
  paramName: string; // Name of loop parameter (e.g., "todo")
  indexName?: string; // Name of index variable if available (e.g., "index")
  needsIndex: boolean; // Whether we need to add index parameter to signature
  isRootElement: boolean; // Whether this element should use the key/index interpolation
  scopeKeyExpr?: Expression; // Scope key expression for hierarchical memoization (e.g., "todo.id" or "index")
}

export class RenderTransformer extends Transformer(RenderIR) {
  #varCounter = 0;
  #prependStatements: Statement[] = [];
  #loopContextStack: LoopContext[] = []; // Stack of loop contexts
  #prependStatementsStack: Statement[][] = []; // Stack for nested prepend statements

  override transform(
    irr: IRRef<RenderIR, MethodDeclaration>,
  ): MethodDeclaration {
    // Reset state for each method
    this.#varCounter = 0;
    this.#prependStatements = [];

    // Transform the method body recursively
    const newBody = irr.node.body
      ? (this.#visitNode(irr.node.body) as unknown as Block)
      : irr.node.body;

    return factory.updateMethodDeclaration(
      irr.node,
      irr.node.modifiers,
      irr.node.asteriskToken,
      irr.node.name,
      irr.node.questionToken,
      irr.node.typeParameters,
      irr.node.parameters,
      irr.node.type,
      newBody,
    );
  }

  /**
   * Visit and transform any node recursively
   */
  #visitNode(node: Node): Node {
    if (isReturnStatement(node)) {
      return this.#transformReturn(
        node as unknown as { expression?: Expression },
      );
    }

    // For if statements, transform both branches
    if (node.kind === SyntaxKind.IfStatement) {
      const ifStmt = node as unknown as {
        expression: Expression;
        thenStatement: Statement;
        elseStatement?: Statement;
      };
      return factory.updateIfStatement(
        node as unknown as Parameters<typeof factory.updateIfStatement>[0],
        ifStmt.expression,
        this.#visitNode(ifStmt.thenStatement) as Statement,
        ifStmt.elseStatement
          ? (this.#visitNode(ifStmt.elseStatement) as Statement)
          : undefined,
      );
    }

    // Recursively visit children
    return visitEachChild(node, (child) => this.#visitNode(child), undefined);
  }

  /**
   * Transform a return statement
   */
  #transformReturn(returnStmt: { expression?: Expression }): Statement {
    if (!returnStmt.expression) {
      return factory.createReturnStatement();
    }

    // Save the current prepend statements
    const savedPrepend = this.#prependStatements;
    this.#prependStatements = [];

    // Transform the return expression
    const transformedExpr = this.#transformExpression(returnStmt.expression);

    // Create sc(this, [transformedExpr]) call
    const setChildrenCall = factory.createCallExpression(
      factory.createIdentifier("sc"),
      undefined,
      [
        factory.createIdentifier("this"),
        factory.createArrayLiteralExpression([transformedExpr]),
      ],
    );

    // If we generated statements, add them before sc
    if (this.#prependStatements.length > 0) {
      const statements = [
        ...this.#prependStatements.map((stmt) => stmt),
        factory.createExpressionStatement(setChildrenCall),
      ];

      this.#prependStatements = savedPrepend;
      return factory.createBlock(statements, true);
    }

    // No transformation needed, just call sc
    this.#prependStatements = savedPrepend;
    return factory.createExpressionStatement(setChildrenCall);
  }

  /**
   * Transform an expression, detecting JSX and converting to zero-dom calls
   */
  #transformExpression(expr: Expression): Expression {
    // Unwrap parenthesized expressions
    if (expr.kind === SyntaxKind.ParenthesizedExpression) {
      const unwrapped = (expr as unknown as { expression: Expression })
        .expression;
      return this.#transformExpression(unwrapped);
    }

    // Handle arrow functions with JSX bodies - transform the body but keep
    // any prepended statements within the function body
    if (expr.kind === SyntaxKind.ArrowFunction) {
      const arrow = expr as unknown as {
        body: Expression | Block;
        parameters: unknown;
      };

      // Skip transformation if body is already a block (has statements)
      if ("statements" in arrow.body) {
        return expr; // Block bodies need different handling
      }

      // For expression bodies, check if they contain JSX or need transformation
      // Save current prepend statements
      const savedPrepend = this.#prependStatements;
      this.#prependStatements = [];

      // Transform the expression body
      const transformedBody = this.#transformExpression(
        arrow.body as Expression,
      );

      // If we generated any prepended statements from JSX transformation,
      // convert the arrow function to have a block body with those statements
      let finalBody: Expression | Block = transformedBody;
      if (this.#prependStatements.length > 0) {
        const statements = [
          ...this.#prependStatements,
          factory.createReturnStatement(
            transformedBody as unknown as Expression,
          ),
        ];
        finalBody = factory.createBlock(statements, true);
      }

      // Restore prepend statements
      this.#prependStatements = savedPrepend;

      return factory.updateArrowFunction(
        expr as unknown as Parameters<typeof factory.updateArrowFunction>[0],
        undefined,
        undefined,
        arrow.parameters as Parameters<typeof factory.updateArrowFunction>[3],
        undefined,
        factory.createToken(SyntaxKind.EqualsGreaterThanToken),
        finalBody as Expression | Block,
      );
    }

    // Handle conditional expressions: condition ? <A/> : <B/>
    if (expr.kind === SyntaxKind.ConditionalExpression) {
      const cond = expr as unknown as {
        condition: Expression;
        whenTrue: Expression;
        whenFalse: Expression;
      };
      return factory.createConditionalExpression(
        cond.condition,
        factory.createToken(SyntaxKind.QuestionToken),
        this.#transformExpression(cond.whenTrue),
        factory.createToken(SyntaxKind.ColonToken),
        this.#transformExpression(cond.whenFalse),
      );
    }

    // Handle binary expressions: condition && <A/>
    if (expr.kind === SyntaxKind.BinaryExpression) {
      const binary = expr as unknown as {
        left: Expression;
        right: Expression;
        operatorToken: { kind: SyntaxKind };
      };
      // Only transform right side if it's JSX
      if (binary.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken) {
        return factory.createBinaryExpression(
          binary.left,
          binary.operatorToken.kind,
          this.#transformExpression(binary.right),
        );
      }
    }

    // Handle call expressions to transform arguments (e.g., map callbacks)
    if (expr.kind === SyntaxKind.CallExpression) {
      const call = expr as unknown as {
        expression: Expression;
        arguments: Expression[];
      };

      // Check if this is a .map() or .forEach() with JSX
      const methodCall = this.#isLoopMethodCall(call.expression);
      if (methodCall && call.arguments.length > 0) {
        const callback = call.arguments[0];
        return this.#transformLoopCall(
          expr as unknown as Parameters<typeof factory.updateCallExpression>[0],
          call.expression,
          callback as Expression,
        );
      }

      const transformedArgs = call.arguments.map((arg) =>
        this.#transformExpression(arg),
      );
      return factory.updateCallExpression(
        expr as unknown as Parameters<typeof factory.updateCallExpression>[0],
        call.expression,
        undefined,
        transformedArgs,
      );
    }

    // Check if this is a JSX element
    if (expr.kind === SyntaxKind.JsxElement) {
      const jsx = expr as unknown as JsxElement;
      const tagName = (
        jsx.openingElement.tagName as unknown as { text: string }
      ).text;
      // For custom components (capitalized), transform children but keep the component
      if (/^[A-Z]/.test(tagName)) {
        return this.#transformCustomComponent(jsx);
      }
      return this.#transformJsxElement(jsx);
    }

    if (expr.kind === SyntaxKind.JsxSelfClosingElement) {
      const jsx = expr as unknown as JsxSelfClosingElement;
      const tagName = (jsx.tagName as unknown as { text: string }).text;
      // For custom components (capitalized), transform attributes but keep the component
      if (/^[A-Z]/.test(tagName)) {
        return this.#transformCustomSelfClosing(jsx);
      }
      return this.#transformJsxSelfClosing(jsx);
    }

    // For other expressions, leave unchanged
    return expr;
  }

  /**
   * Transform children of a custom component (like <Host>)
   * For Host components, extract children and apply Host attributes to 'this'
   * For other custom components, keep the wrapper but transform children
   */
  #transformCustomComponent(jsx: JsxElement): Expression {
    const openingElement = (
      jsx as unknown as {
        openingElement: {
          tagName: { text: string };
          attributes: { properties?: unknown };
        };
      }
    ).openingElement;
    const tagName = openingElement.tagName.text;

    // Special handling for <Host> component
    if (tagName === "Host") {
      // Get Host attributes to apply to 'this'
      const hostAttributes = openingElement.attributes.properties;
      if (hostAttributes && Array.isArray(hostAttributes)) {
        for (const attr of hostAttributes) {
          if (
            attr.kind === SyntaxKind.JsxAttribute &&
            (attr as { name?: { text: string } }).name
          ) {
            const attrName = (attr as { name: { text: string } }).name.text;
            const initializer = (
              attr as {
                initializer?: { kind: SyntaxKind; expression?: Expression };
              }
            ).initializer;

            // Handle event attributes (onMouseEnter, etc.)
            if (attrName.startsWith("on")) {
              const eventName = attrName.slice(2).toLowerCase();
              if (
                initializer?.kind === SyntaxKind.JsxExpression &&
                initializer.expression
              ) {
                this.#prependStatements.push(
                  this.#exprStmt(
                    this.#call(factory.createIdentifier("ael"), [
                      factory.createThis(),
                      factory.createStringLiteral(eventName),
                      initializer.expression,
                    ]),
                  ),
                );
              }
            } else {
              // Regular attributes (class, etc.)
              if (
                initializer?.kind === SyntaxKind.JsxExpression &&
                initializer.expression
              ) {
                this.#prependStatements.push(
                  this.#exprStmt(
                    this.#call(factory.createIdentifier("sp"), [
                      factory.createThis(),
                      factory.createObjectLiteralExpression([
                        factory.createPropertyAssignment(
                          factory.createStringLiteral(attrName),
                          initializer.expression,
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

      // Transform children and return the first child directly
      const children = (
        jsx as unknown as { children?: Array<{ kind: SyntaxKind }> }
      ).children;
      if (children && children.length > 0) {
        // Find the first non-whitespace child
        for (const child of children) {
          if (
            child.kind === SyntaxKind.JsxElement ||
            child.kind === SyntaxKind.JsxSelfClosingElement
          ) {
            return this.#transformExpression(child as unknown as Expression);
          }
          if (child.kind === SyntaxKind.JsxExpression) {
            const expr = (child as unknown as { expression?: Expression })
              .expression;
            if (expr) {
              return this.#transformExpression(expr);
            }
          }
        }
      }

      // If no children, return null
      return factory.createNull();
    }

    // For other custom components, recursively visit all children and transform nested JSX
    return visitEachChild(
      jsx as unknown as Expression,
      (node) => {
        if (
          node.kind === SyntaxKind.JsxElement ||
          node.kind === SyntaxKind.JsxSelfClosingElement
        ) {
          return this.#transformExpression(
            node as Expression,
          ) as unknown as typeof node;
        }
        if (node.kind === SyntaxKind.JsxExpression) {
          const expr = (node as unknown as { expression?: Expression })
            .expression;
          if (expr) {
            const transformed = this.#transformExpression(expr);
            // Create a new JSX expression node with the transformed inner expression
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
   * Transform attributes of a custom self-closing component
   */
  #transformCustomSelfClosing(jsx: JsxSelfClosingElement): Expression {
    // For self-closing custom components, just return as-is
    // (no children to transform)
    return jsx as unknown as Expression;
  }

  /**
   * Transform a JSX element into zero-dom code
   */
  #transformJsxElement(jsx: JsxElement): Expression {
    const varName = this.#genVar();
    const openingElem = jsx.openingElement as unknown as {
      tagName: { text: string };
      attributes: { properties?: unknown };
    };
    const tagName = openingElem.tagName.text || "div";

    // Extract key from attributes if in a loop
    const { keyExpr, remainingAttrs } = this.#extractKeyFromJsx(
      openingElem.attributes.properties,
    );
    openingElem.attributes.properties = remainingAttrs;

    // Build cmc key with hierarchical scope if inside loops
    let cmcKey: Expression;
    const baseKey = `${tagName}_${this.#varCounter - 1}`;
    const loopContext = this.#getCurrentLoopContext();
    const hierarchicalScopeKey = this.#buildHierarchicalScopeKey();

    if (loopContext?.isRootElement) {
      // Mark this as no longer the root for subsequent sibling elements
      loopContext.isRootElement = false;

      // For root element: combine hierarchical scope (parents) with explicit key or current scope
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
          // Explicit key - add it after parent scopes
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
          // No explicit key, but we have the current loop's scope key - add it
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

      cmcKey = key;
    } else {
      // Child element in loop - use hierarchical scope for uniqueness
      if (hierarchicalScopeKey) {
        // Parent scopes exist - use them
        cmcKey = factory.createBinaryExpression(
          factory.createStringLiteral(`${baseKey}_`),
          SyntaxKind.PlusToken,
          hierarchicalScopeKey,
        );
      } else if (loopContext?.scopeKeyExpr) {
        // No parent scopes, but we're in a loop - use current loop's scope
        cmcKey = factory.createBinaryExpression(
          factory.createStringLiteral(`${baseKey}_`),
          SyntaxKind.PlusToken,
          loopContext.scopeKeyExpr,
        );
      } else {
        // Element outside loop
        cmcKey = factory.createStringLiteral(baseKey);
      }
    }

    // Generate element creation
    const createExpr = this.#createElementCreation(tagName);
    const onceCall = this.#call(
      this.#propAccess(factory.createIdentifier("this"), "#cmc"),
      [cmcKey, this.#arrow(createExpr)],
    );

    // Add the element declaration statement
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

    // Set attributes - JSX attributes are in a properties array
    this.#handleAttributes(varName, openingElem.attributes.properties);

    // Handle children
    const children: Expression[] = [];
    const jsxWithChildren = jsx as unknown as {
      children?: Array<{
        kind: SyntaxKind;
        text?: string;
        expression?: Expression;
      }>;
    };

    if (jsxWithChildren.children && jsxWithChildren.children.length > 0) {
      for (let i = 0; i < jsxWithChildren.children.length; i++) {
        const child = jsxWithChildren.children[i];
        if (!child) continue;

        if (child.kind === SyntaxKind.JsxText) {
          const text = child.text || "";
          if (text.trim()) {
            // Build the text node key with hierarchical scope for uniqueness
            let textKey: Expression;
            const baseTextKey = `${varName}_text_${this.#varCounter++}`;
            const textHierarchicalScope = this.#buildHierarchicalScopeKey();

            if (loopContext?.scopeKeyExpr) {
              // We're in a loop - add the scope to text node key
              if (textHierarchicalScope) {
                // Parent scopes exist - combine with current scope
                textKey = factory.createBinaryExpression(
                  factory.createStringLiteral(`${baseTextKey}_`),
                  SyntaxKind.PlusToken,
                  factory.createBinaryExpression(
                    textHierarchicalScope,
                    SyntaxKind.PlusToken,
                    factory.createBinaryExpression(
                      factory.createStringLiteral("_"),
                      SyntaxKind.PlusToken,
                      loopContext.scopeKeyExpr,
                    ),
                  ),
                );
              } else {
                // No parent scopes - just add current scope
                textKey = factory.createBinaryExpression(
                  factory.createStringLiteral(`${baseTextKey}_`),
                  SyntaxKind.PlusToken,
                  loopContext.scopeKeyExpr,
                );
              }
            } else {
              // Not in a loop - use static key
              textKey = factory.createStringLiteral(baseTextKey);
            }

            const textVarName = `${varName}_text_${this.#varCounter - 1}`;
            const textOnce = this.#call(
              this.#propAccess(factory.createIdentifier("this"), "#cmc"),
              [
                textKey,
                this.#arrow(
                  this.#call(factory.createIdentifier("dctn"), [
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
                  1,
                ),
              ),
            );

            children.push(factory.createIdentifier(textVarName));
          }
        } else if (child.kind === SyntaxKind.JsxExpression) {
          // Handle JSX expressions like {variable} or {expression}
          const exprNode = child.expression;
          if (exprNode) {
            // Transform the expression (might contain JSX in conditionals)
            const transformed = this.#transformExpression(
              exprNode as Expression,
            );
            children.push(transformed);
          }
        } else if (
          child.kind === SyntaxKind.JsxElement ||
          child.kind === SyntaxKind.JsxSelfClosingElement
        ) {
          // Recursively transform nested JSX elements
          const transformed = this.#transformExpression(
            child as unknown as Expression,
          );
          children.push(transformed);
        }
      }
    }

    // Set children if any
    if (children.length > 0) {
      this.#prependStatements.push(
        this.#exprStmt(
          this.#call(factory.createIdentifier("sc"), [
            factory.createIdentifier(varName),
            factory.createArrayLiteralExpression(children),
          ]),
        ),
      );
    }

    return factory.createIdentifier(varName);
  }

  /**
   * Transform a self-closing JSX element
   */
  #transformJsxSelfClosing(jsx: JsxSelfClosingElement): Expression {
    const varName = this.#genVar();
    const jsxData = jsx as unknown as {
      tagName: { text: string };
      attributes: { properties?: unknown };
    };
    const tagName = jsxData.tagName.text || "div";

    // Extract key from attributes if in a loop
    const { keyExpr, remainingAttrs } = this.#extractKeyFromJsx(
      jsxData.attributes.properties,
    );
    jsxData.attributes.properties = remainingAttrs;

    // Build cmc key with hierarchical scope if inside loops
    let cmcKey: Expression;
    const baseKey = `${tagName}_${this.#varCounter - 1}`;
    const loopContext = this.#getCurrentLoopContext();
    const hierarchicalScopeKey = this.#buildHierarchicalScopeKey();

    if (loopContext?.isRootElement) {
      // Mark this as no longer the root for subsequent sibling elements
      loopContext.isRootElement = false;

      // For root element: combine hierarchical scope (parents) with explicit key or current scope
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
          // Explicit key - add it after parent scopes
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
          // No explicit key, but we have the current loop's scope key - add it
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

      cmcKey = key;
    } else {
      // Child element in loop - use hierarchical scope for uniqueness
      if (hierarchicalScopeKey) {
        // Parent scopes exist - use them
        cmcKey = factory.createBinaryExpression(
          factory.createStringLiteral(`${baseKey}_`),
          SyntaxKind.PlusToken,
          hierarchicalScopeKey,
        );
      } else if (loopContext?.scopeKeyExpr) {
        // No parent scopes, but we're in a loop - use current loop's scope
        cmcKey = factory.createBinaryExpression(
          factory.createStringLiteral(`${baseKey}_`),
          SyntaxKind.PlusToken,
          loopContext.scopeKeyExpr,
        );
      } else {
        // Element outside loop
        cmcKey = factory.createStringLiteral(baseKey);
      }
    }

    const createExpr = this.#createElementCreation(tagName);
    const onceCall = this.#call(
      this.#propAccess(factory.createIdentifier("this"), "#cmc"),
      [cmcKey, this.#arrow(createExpr)],
    );

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
          1,
        ),
      ),
    );

    // Set attributes - JSX attributes are in a properties array
    this.#handleAttributes(varName, jsxData.attributes.properties);

    return factory.createIdentifier(varName);
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
              // Generate: $0.addEventListener("click", handler)
              this.#prependStatements.push(
                this.#exprStmt(
                  this.#call(factory.createIdentifier("ael"), [
                    factory.createIdentifier(varName),
                    factory.createStringLiteral(eventName),
                    exprNode as Expression,
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
              this.#exprStmt(
                this.#call(factory.createIdentifier("sp"), [
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
              this.#exprStmt(
                this.#call(factory.createIdentifier("sp"), [
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
                this.#exprStmt(
                  this.#call(factory.createIdentifier("sp"), [
                    factory.createIdentifier(varName),
                    factory.createObjectLiteralExpression([
                      factory.createPropertyAssignment(
                        factory.createStringLiteral(attrName),
                        exprNode as Expression,
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
   * Create a call expression: fn(args...)
   */
  #call(func: Expression, args: Expression[]): Expression {
    return factory.createCallExpression(func, undefined, args);
  }

  /**
   * Create an arrow function: () => expr or () => { statements }
   */
  #arrow(body: Expression | Block): Expression {
    if ("statements" in body) {
      return factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(SyntaxKind.EqualsGreaterThanToken),
        body,
      );
    }
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
  #propAccess(obj: Expression, prop: string): Expression {
    return factory.createPropertyAccessExpression(obj, prop);
  }

  /**
   * Create expression statement
   */
  #exprStmt(expr: Expression): Statement {
    return factory.createExpressionStatement(expr);
  }

  /**
   * Generate a new variable name
   */
  #genVar(): string {
    const varName = `$${this.#varCounter}`;
    this.#varCounter++;
    return varName;
  }

  /**
   * Create element factory expression (dce call)
   */
  #createElementCreation(tagName: string): Expression {
    return this.#call(factory.createIdentifier("dce"), [
      factory.createStringLiteral(tagName),
    ]);
  }

  /**
   * Check if an expression is a .map() or .forEach() method call
   */
  #isLoopMethodCall(expr: Expression): boolean {
    if (expr.kind !== SyntaxKind.PropertyAccessExpression) {
      return false;
    }

    const propAccess = expr as unknown as { name?: { text: string } };
    const methodName = propAccess.name?.text;
    return methodName === "map" || methodName === "forEach";
  }

  /**
   * Transform a loop call (.map() or .forEach()) with proper index handling
   */
  #transformLoopCall(
    callExpr: Parameters<typeof factory.updateCallExpression>[0],
    methodExpr: Expression,
    callback: Expression,
  ): Expression {
    // Only arrow functions and function expressions with JSX bodies need transformation
    if (callback.kind !== SyntaxKind.ArrowFunction) {
      const transformedCallback = this.#transformExpression(callback);
      return factory.updateCallExpression(callExpr, methodExpr, undefined, [
        transformedCallback,
      ]);
    }

    const arrowFunc = callback as unknown as {
      parameters: Array<{
        name?: { text: string };
      }>;
      body: Expression | Block;
    };

    // Get the original parameter name (e.g., "todo")
    const paramName = arrowFunc.parameters[0]?.name?.text || "item";
    const hasIndexParam = !!arrowFunc.parameters[1];

    // Pre-pass: Check if we need index for child elements without explicit keys
    let needsIndex = false;
    if (!hasIndexParam) {
      // Only check if user hasn't already provided index
      needsIndex = this.#callbackNeedsIndexForKeys(arrowFunc.body);
    }

    // Determine the index name: use provided one or generate unique name based on depth
    let indexName: string | undefined;
    if (arrowFunc.parameters[1]) {
      // User provided index parameter - use it as-is
      indexName = arrowFunc.parameters[1].name?.text;
    } else if (needsIndex) {
      // Generate unique index name based on loop depth to avoid shadowing
      // depth 0 = "index", depth 1 = "index1", depth 2 = "index2", etc.
      const depth = this.#loopContextStack.length;
      indexName = depth === 0 ? "index" : `index${depth}`;
    }

    // Extract JSX key prop from first JSX element to use as scope key
    // Fallback to index with auto-incremented suffix (index, index2, index3, etc.)
    let scopeKeyExpr: Expression | undefined;
    const jsxKeyFromBody = this.#extractJsxKeyFromBody(arrowFunc.body);
    if (jsxKeyFromBody) {
      // User provided a JSX key - use it as scope key
      scopeKeyExpr = jsxKeyFromBody;
    } else if (indexName) {
      // No explicit key - use index identifier (unique per depth)
      scopeKeyExpr = factory.createIdentifier(indexName);
    }

    // Push loop context onto stack
    // Mark the first element as root (will be marked during JSX transformation)
    const loopContext: LoopContext = {
      paramName,
      indexName: indexName || (needsIndex ? "index" : undefined),
      needsIndex,
      isRootElement: true, // First element is root until proven otherwise
      scopeKeyExpr,
    };
    this.#loopContextStack.push(loopContext);

    // Save current prepend statements and create a new scope for the callback
    const savedPrependStatements = this.#prependStatements;
    this.#prependStatements = [];
    this.#prependStatementsStack.push(savedPrependStatements);

    // Transform the callback body with loop context
    let transformedBody: Expression | Block;
    if ("statements" in arrowFunc.body) {
      // Block body - transform statements
      const block = arrowFunc.body as Block;
      const transformedStatements: Statement[] = [];
      for (const stmt of block.statements) {
        const transformed = this.#visitNode(stmt);
        if (transformed) {
          transformedStatements.push(transformed as Statement);
        }
      }
      transformedBody = factory.createBlock(transformedStatements, true);
    } else {
      // Expression body - transform expression and wrap with prepended statements
      const transformedExpr = this.#transformExpression(
        arrowFunc.body as Expression,
      );

      // If we have prepended statements from JSX transformation, wrap in a block
      if (this.#prependStatements.length > 0) {
        const stmts: Statement[] = [
          ...this.#prependStatements,
          factory.createReturnStatement(transformedExpr),
        ];
        transformedBody = factory.createBlock(stmts, true);
      } else {
        transformedBody = transformedExpr;
      }
    }

    // Restore prepend statements to parent scope
    this.#prependStatementsStack.pop();
    this.#prependStatements = savedPrependStatements;

    // Pop loop context
    this.#loopContextStack.pop();

    // Build new parameters array (cast to proper types)
    const arrowFuncTyped = callback as unknown as {
      parameters: ParameterDeclaration[];
      body: Expression | Block;
    };
    const newParams: ParameterDeclaration[] = [...arrowFuncTyped.parameters];

    // Add index parameter if needed for child elements without explicit keys
    if (needsIndex && !arrowFunc.parameters[1] && indexName) {
      newParams.push(
        factory.createParameterDeclaration(
          undefined,
          undefined,
          factory.createIdentifier(indexName),
          undefined,
          undefined,
          undefined,
        ),
      );
    }

    // Update the arrow function with transformed body and potentially new parameters
    const transformedCallback = factory.updateArrowFunction(
      callback as unknown as Parameters<typeof factory.updateArrowFunction>[0],
      undefined,
      undefined,
      newParams,
      undefined,
      factory.createToken(SyntaxKind.EqualsGreaterThanToken),
      transformedBody,
    );

    return factory.updateCallExpression(callExpr, methodExpr, undefined, [
      transformedCallback,
    ]);
  }

  /**
   * Get the current loop context (if inside a loop)
   */
  #getCurrentLoopContext(): LoopContext | undefined {
    return this.#loopContextStack[this.#loopContextStack.length - 1];
  }

  /**
   * Extract the 'key' prop from JSX attributes and return both the key value and remaining attributes
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

  /**
   * Check if callback body has JSX elements without explicit keys
   * If so, we need to add index parameter for stable memoization
   */
  #callbackNeedsIndexForKeys(body: Expression | Block): boolean {
    let hasElementWithoutKey = false;
    let isFirstElement = true;

    const checkNode = (node: Node): Node => {
      // Look for JSX elements
      if (
        node.kind === SyntaxKind.JsxElement ||
        node.kind === SyntaxKind.JsxSelfClosingElement
      ) {
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
        };

        // Check if this element has a key prop
        const hasKey =
          jsxNode.openingElement?.attributes?.properties?.some(
            (attr) =>
              attr.kind === SyntaxKind.JsxAttribute &&
              attr.name?.text === "key",
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
            const children = jsxNode.children as unknown as Array<{
              kind: SyntaxKind;
            }>;
            for (const child of children) {
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
   * Extract the JSX key prop from the first root element in the callback body
   * Returns the key expression if found, otherwise null
   */
  #extractJsxKeyFromBody(body: Expression | Block): Expression | null {
    const checkNode = (node: Node): Expression | null => {
      if (
        node.kind === SyntaxKind.JsxElement ||
        node.kind === SyntaxKind.JsxSelfClosingElement
      ) {
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
            if (
              attr.kind === SyntaxKind.JsxAttribute &&
              attr.name?.text === "key"
            ) {
              if (
                attr.initializer?.kind === SyntaxKind.JsxExpression &&
                attr.initializer.expression
              ) {
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
      if (
        node.kind === SyntaxKind.ReturnStatement ||
        node.kind === SyntaxKind.ExpressionStatement
      ) {
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
  /**
   * Build hierarchical scope key by concatenating all PARENT loop context scope keys
   * (excluding the current/immediate loop level)
   * Returns a concatenated expression or null if no parent loop contexts
   */
  #buildHierarchicalScopeKey(): Expression | null {
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
    // Start with first key
    let result = scopeKeys[0];

    // Add remaining keys
    for (let i = 1; i < scopeKeys.length; i++) {
      result = factory.createBinaryExpression(
        result,
        SyntaxKind.PlusToken,
        factory.createBinaryExpression(
          factory.createStringLiteral("_"),
          SyntaxKind.PlusToken,
          scopeKeys[i],
        ),
      );
    }

    return result;
  }
}
