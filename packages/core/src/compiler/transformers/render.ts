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
  type Statement,
  SyntaxKind,
  visitEachChild,
} from "typescript";
import type { IRRef } from "../ir/irri.ts";
import { RenderIR } from "../ir/render.ts";
import { Transformer } from "./transformer.ts";

export class RenderTransformer extends Transformer(RenderIR) {
  #varCounter = 0;
  #prependStatements: Statement[] = [];

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

    // Create setChildren(this, [transformedExpr]) call
    const setChildrenCall = factory.createCallExpression(
      factory.createIdentifier("setChildren"),
      undefined,
      [
        factory.createIdentifier("this"),
        factory.createArrayLiteralExpression([transformedExpr]),
      ],
    );

    // If we generated statements, add them before setChildren
    if (this.#prependStatements.length > 0) {
      const statements = [
        ...this.#prependStatements.map((stmt) => stmt),
        factory.createExpressionStatement(setChildrenCall),
      ];

      this.#prependStatements = savedPrepend;
      return factory.createBlock(statements, true);
    }

    // No transformation needed, just call setChildren
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
                  factory.createExpressionStatement(
                    factory.createCallExpression(
                      factory.createPropertyAccessExpression(
                        factory.createThis(),
                        "addEventListener",
                      ),
                      undefined,
                      [
                        factory.createStringLiteral(eventName),
                        initializer.expression,
                      ],
                    ),
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
                  factory.createExpressionStatement(
                    factory.createCallExpression(
                      factory.createPropertyAccessExpression(
                        factory.createThis(),
                        "setAttribute",
                      ),
                      undefined,
                      [
                        factory.createStringLiteral(attrName),
                        initializer.expression,
                      ],
                    ),
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

    // Generate element creation
    const createExpr = this.#createElementCreation(tagName);
    const onceCall = this.#call(
      this.#propAccess(factory.createIdentifier("this"), "#lex"),
      [
        factory.createStringLiteral(`${tagName}_${this.#varCounter - 1}`),
        this.#arrow(createExpr),
      ],
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
            const textVarName = `${varName}_text_${this.#varCounter++}`;
            const textOnce = this.#call(
              this.#propAccess(factory.createIdentifier("this"), "#lex"),
              [
                factory.createStringLiteral(textVarName),
                this.#arrow(
                  this.#call(
                    this.#propAccess(
                      factory.createIdentifier("document"),
                      "createTextNode",
                    ),
                    [factory.createStringLiteral(text)],
                  ),
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
          this.#call(factory.createIdentifier("setChildren"), [
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

    const createExpr = this.#createElementCreation(tagName);
    const onceCall = this.#call(
      this.#propAccess(factory.createIdentifier("this"), "#lex"),
      [
        factory.createStringLiteral(`${tagName}_${this.#varCounter - 1}`),
        this.#arrow(createExpr),
      ],
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
                  this.#call(
                    this.#propAccess(
                      factory.createIdentifier(varName),
                      "addEventListener",
                    ),
                    [
                      factory.createStringLiteral(eventName),
                      exprNode as Expression,
                    ],
                  ),
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
                this.#call(
                  this.#propAccess(
                    factory.createIdentifier(varName),
                    "setAttribute",
                  ),
                  [
                    factory.createStringLiteral(attrName),
                    factory.createStringLiteral(""),
                  ],
                ),
              ),
            );
          } else if (attr.initializer.kind === SyntaxKind.StringLiteral) {
            // Static string attribute: class="foo"
            const attrValue = attr.initializer.text || "";
            this.#prependStatements.push(
              this.#exprStmt(
                this.#call(
                  this.#propAccess(
                    factory.createIdentifier(varName),
                    "setAttribute",
                  ),
                  [
                    factory.createStringLiteral(attrName),
                    factory.createStringLiteral(attrValue),
                  ],
                ),
              ),
            );
          } else if (attr.initializer.kind === SyntaxKind.JsxExpression) {
            // Dynamic attribute: class={expression}
            const exprNode = attr.initializer.expression;
            if (exprNode) {
              this.#prependStatements.push(
                this.#exprStmt(
                  this.#call(
                    this.#propAccess(
                      factory.createIdentifier(varName),
                      "setAttribute",
                    ),
                    [
                      factory.createStringLiteral(attrName),
                      exprNode as Expression,
                    ],
                  ),
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
   * Create element factory expression
   */
  #createElementCreation(tagName: string): Expression {
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier("document"),
        "createElement",
      ),
      undefined,
      [factory.createStringLiteral(tagName)],
    );
  }
}
