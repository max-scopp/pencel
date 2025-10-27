import {
  type Expression,
  factory,
  isReturnStatement,
  type MethodDeclaration,
  type Statement,
  SyntaxKind,
} from "typescript";
import type { IRRef } from "../ir/irri.ts";
import {
  type JSXElementIR,
  type JSXExpressionIR,
  type JSXNodeIR,
  JSXNodeKind,
  type JSXPropIR,
  type JSXSelfClosingIR,
  type JSXTextIR,
  RenderIR,
} from "../ir/render.ts";
import { Transformer } from "./transformer.ts";

/**
 * Metadata about an element for reactive rendering
 */
interface ElementMetadata {
  name: string;
  tagName: string;
  isFunction: boolean;
  attributes: Array<{ name: string; expression: string | null }>;
  children: ElementMetadata[];
  textContent: string | null;
  dynamicContent: string | null;
}

export class RenderTransformer extends Transformer(RenderIR) {
  #elementCounter = 0;
  #elementMetadata: Map<string, ElementMetadata> = new Map();
  #dynamicExpressions: Set<string> = new Set();

  override transform(
    irr: IRRef<RenderIR, MethodDeclaration>,
  ): MethodDeclaration {
    if (!irr.ir.root) {
      return irr.node;
    }

    // Reset state for each render method
    this.#elementCounter = 0;
    this.#elementMetadata.clear();
    this.#dynamicExpressions.clear();

    // Keep all statements before the return statement
    const statementsBeforeReturn: Statement[] = [];
    if (irr.node.body) {
      for (const stmt of irr.node.body.statements) {
        if (isReturnStatement(stmt)) {
          break;
        }
        statementsBeforeReturn.push(stmt);
      }
    }

    // Build metadata tree from JSX
    const rootMetadata = this.#buildElementMetadata(irr.ir.root);

    // Generate element declarations (private fields on class instance)
    const elementNames: string[] = [];
    this.#collectElementNames(rootMetadata, elementNames);

    const letDeclaration = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        elementNames.map((name) =>
          factory.createVariableDeclaration(name, undefined, undefined),
        ),
        1, // let declaration
      ),
    );

    // Generate render statements (create if not exists, always update inline)
    const renderStatements = this.#generateRenderStatements(rootMetadata);

    // Combine: statements before return + let declarations + render logic
    const newStatements = [
      ...statementsBeforeReturn,
      letDeclaration,
      ...renderStatements,
    ];

    // Update the method body
    const newBody = factory.createBlock(newStatements, true);

    // Return updated method
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
   * Build metadata tree from JSX IR for reactive rendering
   */
  #buildElementMetadata(node: JSXNodeIR): ElementMetadata | null {
    switch (node.kind) {
      case JSXNodeKind.Element: {
        const element = node as JSXElementIR;
        this.#elementCounter++;
        const name = `elm$${element.tagName}_${this.#elementCounter}`;

        const attributes = element.attributes.map((attr) => {
          if (attr.type === "prop") {
            const prop = attr as JSXPropIR;
            let expression: string | null = null;
            if (prop.value.type === "expression") {
              expression = (prop.value as { type: string; value: string })
                .value;
              this.#dynamicExpressions.add(expression);
            }
            return { name: prop.name, expression };
          }
          return { name: "", expression: null };
        });

        const metadata: ElementMetadata = {
          name,
          tagName: element.tagName,
          isFunction: element.isFunction,
          attributes,
          children: [],
          textContent: null,
          dynamicContent: null,
        };

        // Process children
        for (const child of element.children) {
          if (child.kind === JSXNodeKind.Text) {
            metadata.textContent = (child as JSXTextIR).text;
          } else if (child.kind === JSXNodeKind.Expression) {
            const expr = child as JSXExpressionIR;
            metadata.dynamicContent = expr.expression;
            this.#dynamicExpressions.add(expr.expression);
          } else {
            const childMeta = this.#buildElementMetadata(child);
            if (childMeta) {
              metadata.children.push(childMeta);
            }
          }
        }

        this.#elementMetadata.set(name, metadata);
        return metadata;
      }

      case JSXNodeKind.SelfClosing: {
        const element = node as JSXSelfClosingIR;
        this.#elementCounter++;
        const name = `elm$${element.tagName}_${this.#elementCounter}`;

        const attributes = element.attributes.map((attr) => {
          if (attr.type === "prop") {
            const prop = attr as JSXPropIR;
            let expression: string | null = null;
            if (prop.value.type === "expression") {
              expression = (prop.value as { type: string; value: string })
                .value;
              this.#dynamicExpressions.add(expression);
            }
            return { name: prop.name, expression };
          }
          return { name: "", expression: null };
        });

        const metadata: ElementMetadata = {
          name,
          tagName: element.tagName,
          isFunction: element.isFunction,
          attributes,
          children: [],
          textContent: null,
          dynamicContent: null,
        };

        this.#elementMetadata.set(name, metadata);
        return metadata;
      }

      case JSXNodeKind.Fragment: {
        const fragment = node as unknown as { children: JSXNodeIR[] };
        const children: ElementMetadata[] = [];
        for (const child of fragment.children) {
          const childMeta = this.#buildElementMetadata(child);
          if (childMeta) {
            children.push(childMeta);
          }
        }
        // Return first child or null for fragments
        return children.length > 0 ? children[0] : null;
      }

      case JSXNodeKind.Text:
      case JSXNodeKind.Expression:
        // Handled in parent
        return null;
    }

    return null;
  }

  /**
   * Collect all element names for let declaration
   */
  #collectElementNames(
    metadata: ElementMetadata | null,
    names: string[],
  ): void {
    if (!metadata) return;

    names.push(metadata.name);
    for (const child of metadata.children) {
      this.#collectElementNames(child, names);
    }
  }

  /**
   * Generate render statements that:
   * 1. Create elements on first render (if not already created)
   * 2. Update properties with inline if-checks
   * 3. Attach to component instance (this)
   */
  #generateRenderStatements(metadata: ElementMetadata | null): Statement[] {
    const statements: Statement[] = [];
    if (!metadata) return statements;

    this.#generateRenderFor(metadata, statements, true);
    return statements;
  }

  /**
   * Recursively generate render logic for element and children
   */
  #generateRenderFor(
    metadata: ElementMetadata,
    statements: Statement[],
    isRoot: boolean,
  ): void {
    // Check if element exists (if (!elm$div_1) { ... })
    const creationStatements = this.#generateElementCreation(metadata);
    const elementCheck = factory.createIfStatement(
      factory.createPrefixUnaryExpression(
        SyntaxKind.ExclamationToken,
        factory.createIdentifier(metadata.name),
      ),
      factory.createBlock(creationStatements, false),
      undefined,
    );
    statements.push(elementCheck);

    // Update element properties (always run, with if-checks inside for efficiency)
    const updateStatements = this.#generateElementUpdates(metadata);
    statements.push(...updateStatements);

    // Attach to component if this is root element
    if (isRoot) {
      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createThis(),
              "appendChild",
            ),
            undefined,
            [factory.createIdentifier(metadata.name)],
          ),
        ),
      );
    }
  }

  /**
   * Generate statements to create an element and its children
   * Only called if element doesn't exist (!elm$div_1)
   */
  #generateElementCreation(metadata: ElementMetadata): Statement[] {
    const statements: Statement[] = [];

    // Create element: elm$div_1 = document.createElement("div") or Host()
    let createExpression: Expression;
    if (metadata.isFunction) {
      createExpression = factory.createCallExpression(
        factory.createIdentifier(metadata.tagName),
        undefined,
        [],
      );
    } else {
      createExpression = factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("document"),
          "createElement",
        ),
        undefined,
        [factory.createStringLiteral(metadata.tagName)],
      );
    }

    statements.push(
      factory.createExpressionStatement(
        factory.createBinaryExpression(
          factory.createIdentifier(metadata.name),
          SyntaxKind.EqualsToken,
          createExpression,
        ),
      ),
    );

    // Create and append children recursively
    for (const child of metadata.children) {
      // Check if child exists, create if not
      const childCreationStatements = this.#generateElementCreation(child);
      const childCheck = factory.createIfStatement(
        factory.createPrefixUnaryExpression(
          SyntaxKind.ExclamationToken,
          factory.createIdentifier(child.name),
        ),
        factory.createBlock(childCreationStatements, false),
        undefined,
      );
      statements.push(childCheck);

      // Append child to parent
      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier(metadata.name),
              "appendChild",
            ),
            undefined,
            [factory.createIdentifier(child.name)],
          ),
        ),
      );
    }

    return statements;
  }

  /**
   * Generate update statements with inline if-checks
   * Only updates when values differ: if (elm$div_1.class != `card ${this.theme}`)
   */
  #generateElementUpdates(metadata: ElementMetadata): Statement[] {
    const statements: Statement[] = [];

    // Update dynamic attributes with if-checks
    for (const attr of metadata.attributes) {
      if (!attr.name || !attr.expression) continue; // Only dynamic

      const valueExpr = factory.createIdentifier(attr.expression);
      const currentValue = factory.createPropertyAccessExpression(
        factory.createIdentifier(metadata.name),
        attr.name,
      );

      // if (elm$div_1.class != `card ${this.theme}`)
      const ifCheck = factory.createIfStatement(
        factory.createBinaryExpression(
          currentValue,
          SyntaxKind.ExclamationEqualsEqualsToken,
          valueExpr,
        ),
        factory.createBlock(
          [
            factory.createExpressionStatement(
              factory.createCallExpression(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier(metadata.name),
                  "setAttribute",
                ),
                undefined,
                [factory.createStringLiteral(attr.name), valueExpr],
              ),
            ),
          ],
          false,
        ),
        undefined,
      );

      statements.push(ifCheck);
    }

    // Update dynamic text content with if-check
    if (metadata.dynamicContent) {
      const currentText = factory.createPropertyAccessExpression(
        factory.createIdentifier(metadata.name),
        "textContent",
      );

      const valueExpr = factory.createIdentifier(metadata.dynamicContent);

      // if (elm$h1_2.textContent != this.title)
      const ifCheck = factory.createIfStatement(
        factory.createBinaryExpression(
          currentText,
          SyntaxKind.ExclamationEqualsEqualsToken,
          valueExpr,
        ),
        factory.createBlock(
          [
            factory.createExpressionStatement(
              factory.createBinaryExpression(
                currentText,
                SyntaxKind.EqualsToken,
                valueExpr,
              ),
            ),
          ],
          false,
        ),
        undefined,
      );

      statements.push(ifCheck);
    }

    // Recursively update children
    for (const child of metadata.children) {
      const childUpdates = this.#generateElementUpdates(child);
      statements.push(...childUpdates);
    }

    return statements;
  }
}
