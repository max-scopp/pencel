/**
 * JSX render method transformer - orchestrates JSX to zero-dom code transformation.
 *
 * Delegates to specialized transformers:
 * - JsxTransformer: JSX element transformation
 * - LoopContextManager: Loop context and index management
 */

import {
  type Block,
  type Expression,
  factory,
  isReturnStatement,
  type JsxElement,
  type JsxFragment,
  type JsxSelfClosingElement,
  type MethodDeclaration,
  type Node,
  type ParameterDeclaration,
  type Statement,
  SyntaxKind,
  visitEachChild,
} from "typescript";
import { VarNameGenerator } from "../../ts-utils/factory-helpers.ts";
import type { IRRef } from "../ir/irri.ts";
import { RenderIR } from "../ir/render.ts";
import { JsxTransformer } from "./render.jsx.ts";
import { LoopContextManager, updateLoopCallback } from "./render.loop.ts";
import { Transformer } from "./transformer.ts";

/**
 * Main RenderTransformer - orchestrates JSX transformation for render methods.
 * Delegates to JSX and loop transformers for specific concerns.
 */
export class RenderTransformer extends Transformer(RenderIR) {
  #varGenerator = new VarNameGenerator();
  #prependStatements: Statement[] = [];
  #prependStatementsStack: Statement[][] = [];
  #loopManager = new LoopContextManager();
  #jsxTransformer: JsxTransformer | null = null;

  override transform(
    irr: IRRef<RenderIR, MethodDeclaration>,
  ): MethodDeclaration {
    // Reset state for each method
    this.#varGenerator.reset();
    this.#prependStatements = [];
    this.#jsxTransformer = new JsxTransformer(this.#varGenerator);

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

    // Save and reset prepend statements for this expression
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

    // If we generated statements, wrap in a block
    if (this.#prependStatements.length > 0) {
      const statements = [
        ...this.#prependStatements,
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

    // Handle arrow functions with JSX bodies
    if (expr.kind === SyntaxKind.ArrowFunction) {
      return this.#transformArrowFunction(expr);
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
      if (binary.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken) {
        return factory.createBinaryExpression(
          binary.left,
          binary.operatorToken.kind,
          this.#transformExpression(binary.right),
        );
      }
    }

    // Handle call expressions (map, forEach, etc.)
    if (expr.kind === SyntaxKind.CallExpression) {
      return this.#transformCallExpression(
        expr as unknown as {
          expression: Expression;
          arguments: Expression[];
        },
        expr as unknown as Parameters<typeof factory.updateCallExpression>[0],
      );
    }

    // Handle JSX elements
    if (expr.kind === SyntaxKind.JsxElement) {
      const jsx = expr as unknown as JsxElement;
      const tagName = (
        jsx.openingElement.tagName as unknown as { text: string }
      ).text;
      if (/^[A-Z]/.test(tagName)) {
        return (
          this.#jsxTransformer?.transformCustomComponent(jsx, (e) =>
            this.#transformExpression(e),
          ) ?? jsx
        );
      }
      this.#jsxTransformer?.setPrependStatements(this.#prependStatements);
      return (
        this.#jsxTransformer?.transformJsxElement(
          jsx,
          this.#loopManager.getCurrent(),
          this.#loopManager.buildHierarchicalScopeKey(),
          (e) => this.#transformExpression(e),
        ) ?? jsx
      );
    }

    if (expr.kind === SyntaxKind.JsxSelfClosingElement) {
      const jsx = expr as unknown as JsxSelfClosingElement;
      const tagName = (jsx.tagName as unknown as { text: string }).text;
      if (/^[A-Z]/.test(tagName)) {
        return jsx as unknown as Expression; // Keep custom components as-is
      }
      this.#jsxTransformer?.setPrependStatements(this.#prependStatements);
      return (
        this.#jsxTransformer?.transformJsxElement(
          jsx,
          this.#loopManager.getCurrent(),
          this.#loopManager.buildHierarchicalScopeKey(),
          (e) => this.#transformExpression(e),
        ) ?? jsx
      );
    }

    // Handle JSX fragments: <>...</>
    if (expr.kind === SyntaxKind.JsxFragment) {
      const fragment = expr as unknown as JsxFragment;
      // Transform each child in the fragment
      const transformedChildren = (
        fragment.children as unknown as Expression[]
      ).map((child) => {
        if (child.kind === SyntaxKind.JsxText) {
          // Skip text nodes - they're handled by the JSX element transformer
          return null;
        }
        return this.#transformExpression(child as Expression);
      });

      // Filter out nulls and create an array of transformed children
      const filtered = transformedChildren.filter((c) => c !== null);

      // If fragment has a single element, return it directly
      if (filtered.length === 1) {
        return filtered[0];
      }

      // If fragment has multiple elements, return them as an array
      if (filtered.length > 0) {
        return factory.createArrayLiteralExpression(filtered);
      }

      // Empty fragment returns empty array
      return factory.createArrayLiteralExpression([]);
    }

    // For other expressions, leave unchanged
    return expr;
  }

  /**
   * Transform arrow function, handling JSX bodies
   */
  #transformArrowFunction(expr: Expression): Expression {
    const arrow = expr as unknown as {
      body: Expression | Block;
      parameters: unknown;
    };

    if ("statements" in arrow.body) {
      return expr; // Block bodies need different handling
    }

    // Save and reset prepend statements
    const savedPrepend = this.#prependStatements;
    this.#prependStatements = [];

    // Transform the expression body
    const transformedBody = this.#transformExpression(arrow.body as Expression);

    // Convert to block if we generated prepended statements
    let finalBody: Expression | Block = transformedBody;
    if (this.#prependStatements.length > 0) {
      const statements = [
        ...this.#prependStatements,
        factory.createReturnStatement(transformedBody as unknown as Expression),
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

  /**
   * Transform call expressions, handling .map() and .forEach()
   */
  #transformCallExpression(
    call: {
      expression: Expression;
      arguments: Expression[];
    },
    callExpr: Parameters<typeof factory.updateCallExpression>[0],
  ): Expression {
    const methodCall = this.#isLoopMethodCall(call.expression);
    if (methodCall && call.arguments.length > 0) {
      const callback = call.arguments[0];
      return this.#transformLoopCall(
        callExpr,
        call.expression,
        callback as Expression,
      );
    }

    const transformedArgs = call.arguments.map((arg) =>
      this.#transformExpression(arg),
    );
    return factory.updateCallExpression(
      callExpr,
      call.expression,
      undefined,
      transformedArgs,
    );
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
    // Only arrow functions need transformation
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

    // Get the original parameter name
    const paramName = arrowFunc.parameters[0]?.name?.text || "item";
    const hasIndexParam = !!arrowFunc.parameters[1];

    // Check if we need index for child elements without explicit keys
    let needsIndex = false;
    if (!hasIndexParam) {
      needsIndex = this.#loopManager.callbackNeedsIndexForKeys(arrowFunc.body);
    }

    // Determine the index name based on depth
    let indexName: string | undefined;
    if (arrowFunc.parameters[1]) {
      indexName = arrowFunc.parameters[1].name?.text;
    } else if (needsIndex) {
      const depth = this.#loopManager.depth();
      indexName = depth === 0 ? "index" : `index${depth}`;
    }

    // Extract JSX key from body or use index
    let scopeKeyExpr: Expression | undefined;
    const jsxKeyFromBody = this.#loopManager.extractJsxKeyFromBody(
      arrowFunc.body,
    );
    if (jsxKeyFromBody) {
      scopeKeyExpr = jsxKeyFromBody;
    } else if (indexName) {
      scopeKeyExpr = factory.createIdentifier(indexName);
    }

    // Push loop context
    this.#loopManager.push({
      paramName,
      indexName: indexName || (needsIndex ? "index" : undefined),
      needsIndex,
      isRootElement: true,
      scopeKeyExpr,
    });

    // Save prepend statements and create new scope
    const savedPrependStatements = this.#prependStatements;
    this.#prependStatementsStack.push(savedPrependStatements);
    this.#prependStatements = [];

    // UPDATE JSX transformer to point to new loop-scope statements
    this.#jsxTransformer?.setPrependStatements(this.#prependStatements);

    // Transform callback body
    let transformedBody: Expression | Block;
    if ("statements" in arrowFunc.body) {
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
      const transformedExpr = this.#transformExpression(
        arrowFunc.body as Expression,
      );

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
    this.#loopManager.pop();

    // UPDATE JSX transformer to point back to parent statements
    this.#jsxTransformer?.setPrependStatements(this.#prependStatements);

    // NOTE: Loop's prepended statements are NOT pushed to parent!
    // They are already embedded in the transformedBody via wrapping in a block.
    // This is critical - statements stay inside the loop callback.

    // Build new parameters
    const arrowFuncTyped = callback as unknown as {
      parameters: ParameterDeclaration[];
    };
    const newParams: ParameterDeclaration[] = [...arrowFuncTyped.parameters];

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

    // Update callback
    const transformedCallback = updateLoopCallback(
      callback,
      transformedBody,
      newParams,
    );

    return factory.updateCallExpression(callExpr, methodExpr, undefined, [
      transformedCallback,
    ]);
  }
}
