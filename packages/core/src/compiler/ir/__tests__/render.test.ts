import { describe, expect, test } from "bun:test";
import {
  type ClassDeclaration,
  createSourceFile,
  isClassDeclaration,
  isMethodDeclaration,
  ScriptKind,
  type ScriptTarget,
} from "typescript";
import {
  type JSXExpressionIR,
  JSXNodeKind,
  type JSXSelfClosingIR,
  type RenderIR,
  RenderIR as RenderIRClass,
} from "../render.ts";

describe("RenderIR", () => {
  function parseRenderIR(source: string): RenderIR | null {
    const sourceFile = createSourceFile(
      "test.tsx",
      source,
      99 as ScriptTarget /* Latest */,
      true,
      ScriptKind.TSX,
    );

    // Find the class declaration
    let classDecl: ClassDeclaration | undefined;
    sourceFile.forEachChild((node) => {
      if (isClassDeclaration(node)) {
        classDecl = node;
      }
    });

    if (!classDecl) return null;

    // Find the render method
    const renderMethod = classDecl.members.find(
      (m) => isMethodDeclaration(m) && m.name?.getText() === "render",
    );

    if (!renderMethod || !isMethodDeclaration(renderMethod)) return null;

    return new RenderIRClass(renderMethod);
  }

  test("parses simple Host element with slot", () => {
    const source = `
      class TestComponent {
        render() {
          return (
            <Host>
              <slot />
            </Host>
          );
        }
      }
    `;

    const renderIR = parseRenderIR(source);
    expect(renderIR).toBeTruthy();
    expect(renderIR?.root).toBeTruthy();

    const root = renderIR?.root;
    expect(root?.kind).toBe(JSXNodeKind.Element);

    if (root?.kind === JSXNodeKind.Element) {
      expect(root.tagName).toBe("Host");
      expect(root.isComponent).toBe(true);
      expect(root.children).toHaveLength(1);

      const slot = root.children[0] as JSXSelfClosingIR;
      expect(slot?.kind).toBe(JSXNodeKind.SelfClosing);
      if (slot?.kind === JSXNodeKind.SelfClosing) {
        expect(slot.tagName).toBe("slot");
        expect(slot.isComponent).toBe(false);
      }
    }
  });

  test("parses pen-button component", () => {
    const source = `
      import {
        Component,
        type ComponentInterface,
        Host,
        type VNode,
      } from "@pencel/runtime";

      @Component({
        tag: "button",
      })
      export class HTMLPenButtonElement
        extends HTMLButtonElement
        implements ComponentInterface
      {
        render(): VNode {
          return (
            <Host>
              <slot />
            </Host>
          );
        }
      }
    `;

    const renderIR = parseRenderIR(source);
    expect(renderIR?.root).toBeTruthy();

    const root = renderIR?.root;
    if (root?.kind === JSXNodeKind.Element) {
      expect(root.tagName).toBe("Host");
      expect(root.children).toHaveLength(1);
      expect(root.children[0]?.kind).toBe(JSXNodeKind.SelfClosing);
    }
  });

  test("parses element with attributes", () => {
    const source = `
      class TestComponent {
        render() {
          return <div className="test" data-id={123} disabled />;
        }
      }
    `;

    const renderIR = parseRenderIR(source);
    const root = renderIR?.root;

    expect(root?.kind).toBe(JSXNodeKind.SelfClosing);
    if (root?.kind === JSXNodeKind.SelfClosing) {
      expect(root.tagName).toBe("div");
      expect(root.attributes).toHaveLength(3);

      // className="test"
      expect(root.attributes[0]).toEqual({
        type: "prop",
        name: "className",
        value: { type: "string", value: "test" },
      });

      // data-id={123}
      expect(root.attributes[1]).toEqual({
        type: "prop",
        name: "data-id",
        value: { type: "expression", value: "123" },
      });

      // disabled (boolean shorthand)
      expect(root.attributes[2]).toEqual({
        type: "prop",
        name: "disabled",
        value: { type: "true" },
      });
    }
  });

  test("parses JSX with text and expressions", () => {
    const source = `
      class TestComponent {
        render() {
          return (
            <div>
              Hello {name}!
            </div>
          );
        }
      }
    `;

    const renderIR = parseRenderIR(source);
    const root = renderIR?.root;

    if (root?.kind === JSXNodeKind.Element) {
      expect(root.children).toHaveLength(3); // "Hello ", {name}, "!"

      expect(root.children[0]?.kind).toBe(JSXNodeKind.Text);
      expect(root.children[1]?.kind).toBe(JSXNodeKind.Expression);
      expect(root.children[2]?.kind).toBe(JSXNodeKind.Text);

      const exprNode = root.children[1] as JSXExpressionIR;
      if (exprNode?.kind === JSXNodeKind.Expression) {
        expect(exprNode.expression).toBe("name");
        expect(exprNode.isSimple).toBe(true);
      }
    }
  });

  test("parses JSX Fragment", () => {
    const source = `
      class TestComponent {
        render() {
          return (
            <>
              <div>One</div>
              <div>Two</div>
            </>
          );
        }
      }
    `;

    const renderIR = parseRenderIR(source);
    const root = renderIR?.root;

    expect(root?.kind).toBe(JSXNodeKind.Fragment);
    if (root?.kind === JSXNodeKind.Fragment) {
      expect(root.children).toHaveLength(2);
      expect(root.children[0]?.kind).toBe(JSXNodeKind.Element);
      expect(root.children[1]?.kind).toBe(JSXNodeKind.Element);
    }
  });

  test("serializes to JSON correctly", () => {
    const source = `
      class TestComponent {
        render() {
          return <Host><slot /></Host>;
        }
      }
    `;

    const renderIR = parseRenderIR(source);
    const json = JSON.stringify(renderIR?.root, null, 2);

    expect(json).toContain('"kind": "Element"');
    expect(json).toContain('"tagName": "Host"');
    expect(json).toContain('"kind": "SelfClosing"');
    expect(json).toContain('"tagName": "slot"');
  });
});
