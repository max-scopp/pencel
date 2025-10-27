import {
  type Expression,
  isJsxElement,
  isJsxFragment,
  isJsxSelfClosingElement,
  isReturnStatement,
  type JsxAttribute,
  type JsxAttributeLike,
  type JsxAttributes,
  type JsxChild,
  type JsxElement,
  type JsxExpression,
  type JsxFragment,
  type JsxSelfClosingElement,
  type JsxSpreadAttribute,
  type JsxText,
  type MethodDeclaration,
  type ParenthesizedExpression,
  type ReturnStatement,
  type StringLiteral,
  SyntaxKind,
} from "typescript";
import { IRM } from "./irri.ts";

/**
 * JSX Node Kinds - mirrors runtime VNodeKind but for compile-time IR
 */
export enum JSXNodeKind {
  Element = "Element", // <div>...</div> or <MyComponent>
  SelfClosing = "SelfClosing", // <img /> or <MyComponent />
  Fragment = "Fragment", // <>...</>
  Text = "Text", // plain text content
  Expression = "Expression", // {someVar} or {someFunc()}
}

/**
 * Base interface for all JSX IR nodes
 */
export interface JSXNodeIR {
  kind: JSXNodeKind;
}

/**
 * Represents a JSX element like <div>...</div> or <Host>...</Host>
 */
export interface JSXElementIR extends JSXNodeIR {
  kind: JSXNodeKind.Element;
  tagName: string; // "div", "Host", "MyComponent"
  attributes: JSXAttributeIR[];
  children: JSXNodeIR[];
  /**
   * Whether this is a functional component (uppercase, Host, etc) that must be called,
   * vs an HTML element that can be created with createElement.
   * Functional: Host, MyComponent, Button → must call Host(...), MyComponent(...)
   * Elements: div, span, button → createElement("div", ...)
   */
  isFunction: boolean;
}

/**
 * Represents a self-closing JSX element like <img /> or <slot />
 */
export interface JSXSelfClosingIR extends JSXNodeIR {
  kind: JSXNodeKind.SelfClosing;
  tagName: string;
  attributes: JSXAttributeIR[];
  /**
   * Whether this is a functional component vs an HTML element.
   * Functional: MyComponent, MySlot → must call MyComponent(...), MySlot(...)
   * Elements: img, input, slot → createElement("img", ...)
   */
  isFunction: boolean;
}

/**
 * Represents a JSX fragment <>...</>
 */
export interface JSXFragmentIR extends JSXNodeIR {
  kind: JSXNodeKind.Fragment;
  children: JSXNodeIR[];
}

/**
 * Represents text content in JSX
 */
export interface JSXTextIR extends JSXNodeIR {
  kind: JSXNodeKind.Text;
  text: string;
}

/**
 * Represents a JSX expression like {someVar} or {count + 1}
 */
export interface JSXExpressionIR extends JSXNodeIR {
  kind: JSXNodeKind.Expression;
  /**
   * The expression as source text for serialization
   */
  expression: string;
  /**
   * Whether this is a simple identifier (true) vs complex expression (false)
   */
  isSimple: boolean;
}

/**
 * Represents a JSX attribute (prop or spread)
 */
export type JSXAttributeIR = JSXPropIR | JSXSpreadIR;

/**
 * Regular attribute like className="foo" or onClick={handler}
 */
export interface JSXPropIR {
  type: "prop";
  name: string;
  value: JSXAttributeValueIR;
}

/**
 * Spread attribute like {...props}
 */
export interface JSXSpreadIR {
  type: "spread";
  expression: string;
}

/**
 * Values that can be assigned to JSX attributes
 */
export type JSXAttributeValueIR =
  | { type: "string"; value: string }
  | { type: "expression"; value: string }
  | { type: "true" }; // shorthand boolean like <input disabled />

/**
 * Root IR node for the render() method
 */
export type JSXRootIR =
  | JSXElementIR
  | JSXSelfClosingIR
  | JSXFragmentIR
  | JSXTextIR
  | JSXExpressionIR;

/**
 * Converts the JSX into an IR so it can be rewritten to patch logic.
 */
export class RenderIR extends IRM("Render") {
  readonly root: JSXRootIR | null;

  constructor(renderMember: MethodDeclaration) {
    super();

    // Find the return statement in the render method
    const returnStatement = this.#findReturnStatement(renderMember);
    if (!returnStatement?.expression) {
      this.root = null;
      return;
    }

    // Parse the JSX expression
    this.root = this.#parseJSXNode(returnStatement.expression);
  }

  #findReturnStatement(method: MethodDeclaration): ReturnStatement | null {
    if (!method.body) return null;

    for (const statement of method.body.statements) {
      if (isReturnStatement(statement)) {
        return statement;
      }
    }

    return null;
  }

  #parseJSXNode(node: Expression): JSXRootIR | null {
    // Unwrap parenthesized expressions
    if (node.kind === SyntaxKind.ParenthesizedExpression) {
      const paren = node as ParenthesizedExpression;
      return this.#parseJSXNode(paren.expression);
    }

    if (isJsxElement(node)) {
      return this.#parseJsxElement(node);
    }

    if (isJsxSelfClosingElement(node)) {
      return this.#parseJsxSelfClosing(node);
    }

    if (isJsxFragment(node)) {
      return this.#parseJsxFragment(node);
    }

    // Fallback for other expression types (variables, function calls, etc.)
    return {
      kind: JSXNodeKind.Expression,
      expression: node.getText(),
      isSimple: node.kind === SyntaxKind.Identifier,
    };
  }

  #parseJsxElement(element: JsxElement): JSXElementIR {
    const tagName = element.openingElement.tagName.getText();

    return {
      kind: JSXNodeKind.Element,
      tagName,
      attributes: this.#parseAttributes(element.openingElement.attributes),
      children: this.#parseChildren(element.children),
      isFunction: this.#isFunctionComponent(tagName),
    };
  }

  #parseJsxSelfClosing(element: JsxSelfClosingElement): JSXSelfClosingIR {
    const tagName = element.tagName.getText();

    return {
      kind: JSXNodeKind.SelfClosing,
      tagName,
      attributes: this.#parseAttributes(element.attributes),
      isFunction: this.#isFunctionComponent(tagName),
    };
  }

  #parseJsxFragment(fragment: JsxFragment): JSXFragmentIR {
    return {
      kind: JSXNodeKind.Fragment,
      children: this.#parseChildren(fragment.children),
    };
  }

  #parseChildren(children: readonly JsxChild[]): JSXNodeIR[] {
    const result: JSXNodeIR[] = [];

    for (const child of children) {
      const parsed = this.#parseJsxChild(child);
      if (parsed) {
        result.push(parsed);
      }
    }

    return result;
  }

  #parseJsxChild(child: JsxChild): JSXNodeIR | null {
    // JsxElement
    if (isJsxElement(child)) {
      return this.#parseJsxElement(child);
    }

    // JsxSelfClosingElement
    if (isJsxSelfClosingElement(child)) {
      return this.#parseJsxSelfClosing(child);
    }

    // JsxFragment
    if (isJsxFragment(child)) {
      return this.#parseJsxFragment(child);
    }

    // JsxText
    if (child.kind === SyntaxKind.JsxText) {
      const text = (child as JsxText).text.trim();
      if (!text) return null; // Skip whitespace-only text nodes

      return {
        kind: JSXNodeKind.Text,
        text,
      } as JSXTextIR;
    }

    // JsxExpression
    if (child.kind === SyntaxKind.JsxExpression) {
      const expr = child as JsxExpression;
      if (!expr.expression) return null;

      return {
        kind: JSXNodeKind.Expression,
        expression: expr.expression.getText(),
        isSimple: expr.expression.kind === SyntaxKind.Identifier,
      } as JSXExpressionIR;
    }

    return null;
  }

  #parseAttributes(attributes: JsxAttributes): JSXAttributeIR[] {
    const result: JSXAttributeIR[] = [];

    for (const prop of attributes.properties) {
      const parsed = this.#parseAttribute(prop);
      if (parsed) {
        result.push(parsed);
      }
    }

    return result;
  }

  #parseAttribute(attr: JsxAttributeLike): JSXAttributeIR | null {
    // JsxAttribute: name="value" or name={expr}
    if (attr.kind === SyntaxKind.JsxAttribute) {
      const jsxAttr = attr as JsxAttribute;
      const name = jsxAttr.name.getText();

      // Boolean shorthand: <input disabled />
      if (!jsxAttr.initializer) {
        return {
          type: "prop",
          name,
          value: { type: "true" },
        };
      }

      // String literal: className="foo"
      if (jsxAttr.initializer.kind === SyntaxKind.StringLiteral) {
        return {
          type: "prop",
          name,
          value: {
            type: "string",
            value: (jsxAttr.initializer as StringLiteral).text,
          },
        };
      }

      // Expression: onClick={handler}
      if (jsxAttr.initializer.kind === SyntaxKind.JsxExpression) {
        const expr = jsxAttr.initializer as JsxExpression;
        if (!expr.expression) return null;

        return {
          type: "prop",
          name,
          value: {
            type: "expression",
            value: expr.expression.getText(),
          },
        };
      }
    }

    // JsxSpreadAttribute: {...props}
    if (attr.kind === SyntaxKind.JsxSpreadAttribute) {
      const spread = attr as JsxSpreadAttribute;
      return {
        type: "spread",
        expression: spread.expression.getText(),
      };
    }

    return null;
  }

  /**
   * Determines if a tag name represents a functional component vs HTML element.
   * Functional components: uppercase names, or special Pencel functions like "Host"
   * HTML elements: lowercase names like "div", "span", "button"
   *
   * Functional components must be called: Host(...), MyButton(...)
   * HTML elements are created: createElement("div", ...)
   */
  #isFunctionComponent(tagName: string): boolean {
    // Special Pencel functional components
    if (tagName === "Host") return true;

    // First character uppercase = functional component
    return tagName[0] === tagName[0]?.toUpperCase();
  }
}
