import {
  type Block,
  type Expression,
  factory,
  isArrayLiteralExpression,
  isArrowFunction,
  isFunctionExpression,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isShorthandPropertyAssignment,
  isSpreadAssignment,
  isStringLiteral,
  type PropertyName,
  SyntaxKind,
} from "typescript";

/**
 * Simple type guard for ASTNode
 */
export function isASTNode(obj: unknown): obj is ASTNode {
  return (
    typeof obj === "object" && obj !== null && "kind" in obj && "text" in obj
  );
}

/**
 * TS AST Viewer–style node
 */
export interface ASTNode {
  kindName: string;
  kind: SyntaxKind;
  text?: string;
  children: ASTNode[];
  pos?: number;
  end?: number;
  flags?: number;
}

/**
 * Serialize a TS Expression into a TS AST Viewer–like node
 */
export function serializeNode(expr: Expression): ASTNode {
  const base: ASTNode = {
    kind: expr.kind,
    kindName: SyntaxKind[expr.kind],
    pos: expr.pos,
    end: expr.end,
    flags: expr.flags,
    children: [],
    text: undefined,
  };

  if (isStringLiteral(expr)) base.text = expr.text;
  else if (isNumericLiteral(expr)) base.text = expr.text;
  else if (expr.kind === SyntaxKind.TrueKeyword) base.text = "true";
  else if (expr.kind === SyntaxKind.FalseKeyword) base.text = "false";
  else if (expr.kind === SyntaxKind.NullKeyword) base.text = "null";
  else if (isArrayLiteralExpression(expr)) {
    base.children = expr.elements.map(serializeNode);
  } else if (isObjectLiteralExpression(expr)) {
    base.children = expr.properties.map((prop) => {
      if (isPropertyAssignment(prop)) {
        return {
          kind: prop.kind,
          kindName: SyntaxKind[prop.kind],
          children: [
            {
              kind: prop.name.kind,
              kindName: SyntaxKind[prop.name.kind],
              text: getPropName(prop.name),
              children: [],
            },
            serializeNode(prop.initializer),
          ],
          pos: prop.pos,
          end: prop.end,
          flags: prop.flags,
        };
      }
      if (isShorthandPropertyAssignment(prop)) {
        return {
          kind: prop.kind,
          kindName: SyntaxKind[prop.kind],
          children: [
            {
              kind: prop.name.kind,
              kindName: SyntaxKind[prop.name.kind],
              text: prop.name.text,
              children: [],
            },
            {
              kind: prop.name.kind,
              kindName: SyntaxKind[prop.name.kind],
              text: prop.name.text,
              children: [],
            },
          ],
          pos: prop.pos,
          end: prop.end,
          flags: prop.flags,
        };
      }
      if (isSpreadAssignment(prop)) {
        return {
          kind: prop.kind,
          kindName: SyntaxKind[prop.kind],
          children: [serializeNode(prop.expression)],
          pos: prop.pos,
          end: prop.end,
          flags: prop.flags,
        };
      }
      return {
        kind: prop.kind,
        kindName: SyntaxKind[prop.kind],
        children: [],
        pos: prop.pos,
        end: prop.end,
        flags: prop.flags,
      };
    });
  } else if (isArrowFunction(expr) || isFunctionExpression(expr)) {
    base.children = expr.parameters.map((p) => ({
      kind: p.kind,
      kindName: SyntaxKind[p.kind],
      text: p.name.getText(),
      children: [],
      pos: p.pos,
      end: p.end,
      flags: p.flags,
    }));
    base.children.push(serializeNode(expr.body as Expression));
  } else {
    base.text = expr.getText();
  }

  return base;
}

/**
 * Deserialize ASTNode back to ts.Expression
 */
export function deserializeNode(ast: ASTNode): Expression {
  switch (ast.kindName) {
    case "StringLiteral":
      return factory.createStringLiteral(ast.text ?? "");
    case "NumericLiteral":
      return factory.createNumericLiteral(ast.text ?? "0");
    case "TrueKeyword":
      return factory.createTrue();
    case "FalseKeyword":
      return factory.createFalse();
    case "NullKeyword":
      return factory.createNull();
    case "ArrayLiteralExpression":
      return factory.createArrayLiteralExpression(
        ast.children.map(deserializeNode),
        false,
      );
    case "ObjectLiteralExpression": {
      const props = ast.children.map((child) => {
        if (child.kindName === "PropertyAssignment") {
          const keyNode = child.children[0];
          const valueNode = child.children[1];
          return factory.createPropertyAssignment(
            factory.createStringLiteral(keyNode.text ?? ""),
            deserializeNode(valueNode),
          );
        }
        if (child.kindName === "SpreadAssignment") {
          return factory.createSpreadAssignment(
            deserializeNode(child.children[0]),
          );
        }
        throw new Error(
          `Unknown object literal property kind: ${child.kindName}`,
        );
      });
      return factory.createObjectLiteralExpression(props, true);
    }
    case "ArrowFunction":
      return deserializeArrowFunction(ast);
    case "FunctionExpression":
      return deserializeFunctionExpression(ast);
    default:
      return factory.createIdentifier(ast.text ?? "");
  }
}

/** Helpers */

function getPropName(name: PropertyName): string {
  if (isStringLiteral(name) || isNumericLiteral(name) || "text" in name)
    return (name as any).text;
  return name.getText();
}

/** Function deserialization helpers */

function ensureBlock(body: Expression): Block {
  if ((body as any).statements) return body as any as Block;
  return factory.createBlock([factory.createReturnStatement(body)], true);
}

function deserializeArrowFunction(ast: ASTNode): Expression {
  const params = ast.children
    .slice(0, -1)
    .map((p) =>
      factory.createParameterDeclaration(undefined, undefined, p.text ?? ""),
    );
  const bodyExpr = deserializeNode(ast.children[ast.children.length - 1]);
  // Arrow functions can have concise expression bodies
  const body = (bodyExpr as any).statements ? bodyExpr : bodyExpr;
  return factory.createArrowFunction(
    undefined,
    undefined,
    params,
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    body,
  );
}

function deserializeFunctionExpression(ast: ASTNode): Expression {
  const params = ast.children
    .slice(0, -1)
    .map((p) =>
      factory.createParameterDeclaration(undefined, undefined, p.text ?? ""),
    );
  const bodyExpr = deserializeNode(ast.children[ast.children.length - 1]);
  const bodyBlock = ensureBlock(bodyExpr);
  return factory.createFunctionExpression(
    undefined,
    undefined,
    undefined,
    undefined,
    params,
    undefined,
    bodyBlock,
  );
}
