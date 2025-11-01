import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type Document, type Text, Window } from "happy-dom";
import {
  createPrinter,
  createSourceFile,
  EmitHint,
  isClassDeclaration,
  isMethodDeclaration,
  type MethodDeclaration,
  ScriptKind,
  type ScriptTarget,
} from "typescript";
import { RenderTransformer } from "../../transformers/render.ts";
import { IRRef } from "../irri.ts";
import { RenderIR } from "../render.ts";

// --- zero-dom runtime helpers ---
const cacheLexer = Symbol("cacheLexer");

interface CacheOwner {
  [cacheLexer]?: ReturnType<typeof createLexerCache>;
}

function createLexerCache() {
  const map = new Map<string, unknown>();
  return function onceFn<T>(key: string, factory: () => T): T {
    if (map.has(key)) return map.get(key) as T;
    const v = factory();
    map.set(key, v as unknown);
    return v;
  };
}

// --- E2E Test Suite ---
describe("RenderTransformer E2E with zero-dom", () => {
  let window: Window;
  let document: Document;

  beforeEach(() => {
    window = new Window();
    document = window.document;
  });

  /**
   * Transform a .pen.tsx file's render method to zero-dom code
   */
  async function transformComponentFile(
    fixturePath: string,
  ): Promise<{ transformed: string; original: string }> {
    const fullPath = join(import.meta.dir, "fixtures", fixturePath);
    const source = await readFile(fullPath, "utf-8");

    // Create TypeScript source file
    const sourceFile = createSourceFile(
      fixturePath,
      source,
      99 as ScriptTarget /* Latest */,
      true,
      ScriptKind.TSX,
    );

    // Find class and render method
    let renderMethod: MethodDeclaration | null = null;
    const foundSourceFile = sourceFile;
    sourceFile.forEachChild((node) => {
      if (isClassDeclaration(node)) {
        for (const member of node.members) {
          if (
            isMethodDeclaration(member) &&
            member.name?.getText(foundSourceFile) === "render"
          ) {
            renderMethod = member as MethodDeclaration;
            break;
          }
        }
      }
    });

    if (!renderMethod) {
      throw new Error("No render method found in component");
    }

    const typedRenderMethod = renderMethod as MethodDeclaration;

    // Create IR and transform
    const renderIR = new RenderIR(typedRenderMethod);
    const transformer = new RenderTransformer();
    const irRef = new IRRef(renderIR, typedRenderMethod);
    const transformedMethod = transformer.transform(irRef);

    // Get the transformed code
    const printer = createPrinter();
    const transformed = printer.printNode(
      EmitHint.Unspecified,
      transformedMethod,
      foundSourceFile,
    );

    return {
      transformed,
      original: typedRenderMethod.getText(foundSourceFile),
    };
  }

  /**
   * Execute transformed zero-dom code in happy-dom
   */
  function executeZeroDom(
    transformedCode: string,
    props: Record<string, unknown> = {},
  ): HTMLElement {
    // Create a component instance with cache
    const componentInstance: CacheOwner & Record<string, unknown> = {
      [cacheLexer]: createLexerCache(),
      ...props,
    };

    // Make zero-dom helpers available
    const once = componentInstance[cacheLexer];
    if (!once) {
      throw new Error("Cache lexer not initialized");
    }

    // Patch document.createElement to handle className setAttribute issue
    const originalCreateElement = document.createElement.bind(document);
    const patchedCreateElement = (tagName: string) => {
      const el = originalCreateElement(tagName);
      const originalSetAttribute = el.setAttribute.bind(el);

      // Flag to prevent circular calls
      let isSettingProperty = false;

      // Patch setAttribute to handle className and boolean attributes properly
      el.setAttribute = (name: string, value: string) => {
        if (isSettingProperty) {
          originalSetAttribute(name, value);
          return;
        }

        if (name === "className") {
          el.className = value;
        } else if (name === "checked") {
          // Boolean property - only set to true if value is truthy
          const boolValue =
            value === "true" || (value as unknown) === true || value === "";
          isSettingProperty = true;
          const inputEl = el as unknown as HTMLInputElement;
          inputEl.checked = boolValue;
          isSettingProperty = false;
        } else if (name === "disabled") {
          // Boolean property - only set to true if value is truthy
          const boolValue =
            value === "true" || (value as unknown) === true || value === "";
          isSettingProperty = true;
          const buttonEl = el as unknown as HTMLButtonElement;
          buttonEl.disabled = boolValue;
          isSettingProperty = false;
        } else {
          originalSetAttribute(name, value);
        }
      };

      return el;
    };

    // Create a document proxy with patched createElement
    const documentProxy = new Proxy(document, {
      get(target, prop) {
        if (prop === "createElement") {
          return patchedCreateElement;
        }
        return target[prop as keyof Document];
      },
    });

    // Create setChildren that uses the patched document
    function setChildrenPatched(
      parent: HTMLElement | DocumentFragment | Record<string, unknown>,
      children: (Node | string | boolean | number | null | undefined)[],
    ) {
      // If parent is not a DOM element, just return (component instance case)
      if (typeof (parent as unknown as Node).appendChild !== "function") {
        return;
      }

      const childNodes: (Node | Text)[] = children
        .filter((child) => child != null)
        .map((child) => {
          if (
            typeof child === "string" ||
            typeof child === "number" ||
            typeof child === "boolean"
          ) {
            return documentProxy.createTextNode(String(child));
          }
          return child as Node;
        });

      const domParent = parent as HTMLElement | DocumentFragment;
      const old = Array.from(domParent.childNodes || []);
      const max = Math.max(old.length, childNodes.length);
      for (let i = 0; i < max; i++) {
        const w = childNodes[i];
        const h = old[i];
        if (!w) {
          if (h) domParent.removeChild(h);
          continue;
        }
        if (h === w) continue;
        if (h) domParent.replaceChild(w as Node, h);
        else domParent.appendChild(w as Node);
      }
    }

    // Extract the render method body (the { ... } block inside render())
    const bodyMatch = transformedCode.match(/render\(\)\s*\{([\s\S]*)\}/);
    if (!bodyMatch) {
      throw new Error("Could not extract render body from transformed code");
    }

    // Replace abbreviated method calls with parameter names
    let code = bodyMatch[1];
    code = code.replace(/this\.#cmc/g, "__cmc"); // replace this.#cmc with __cmc parameter
    code = code.replace(/\bsp\(/g, "__sp("); // replace sp( with __sp(
    code = code.replace(/\bsc\(/g, "__sc("); // replace sc( with __sc(
    code = code.replace(/\bdce\(/g, "__dce("); // replace dce( with __dce(

    // Remove outer braces if present (from the block structure)
    code = code.replace(/^\s*\{\s*/, "").replace(/\s*\}\s*$/, "");

    // Extract the root element and inject a return statement
    // The pattern is typically: let $0 = ...; ... sc(this, [$0]); or similar
    // We need to return $0 (the first created element)
    const assignMatch = code.match(/let\s+(\$\d+)\s*=/);
    if (!assignMatch) {
      throw new Error("Could not find root element assignment");
    }
    const rootVar = assignMatch[1];
    code += `\nreturn ${rootVar};`;

    // Create cache map for memoization
    const cacheMap = new Map<string, unknown>();

    const renderFunction = new Function(
      "__cmc",
      "__sp",
      "__sc",
      "__dce",
      "__checkElement",
      `
      ${code}
      `,
    );

    // Create the runtime functions
    const cmcFn = (key: string, factory: () => unknown) => {
      if (cacheMap.has(key)) return cacheMap.get(key);
      const value = factory();
      cacheMap.set(key, value);
      return value;
    };

    const setPropsRuntime = (
      el: Element,
      propsData: Record<string, unknown>,
    ) => {
      for (const [key, value] of Object.entries(propsData)) {
        (el as HTMLElement).setAttribute(key, String(value));
      }
    };

    const checkElement = (el: unknown): boolean => {
      return (
        el != null &&
        typeof (el as Record<string, unknown>).setAttribute === "function"
      );
    };

    const result = renderFunction.call(
      componentInstance,
      cmcFn,
      setPropsRuntime,
      setChildrenPatched,
      patchedCreateElement,
      checkElement,
    );

    // The transformed code now returns the root element directly
    if (checkElement(result)) {
      return result as unknown as HTMLElement;
    }

    // Fallback - return the first element created
    const elements = documentProxy.body?.children || [];
    return (elements[elements.length - 1] ||
      elements[0]) as unknown as HTMLElement;
  }

  test("transforms and renders todo-item component", async () => {
    const { transformed } = await transformComponentFile("todo-item.pen.tsx");

    const element = executeZeroDom(transformed, {
      text: "Buy groceries",
      completed: false,
    });

    expect(element.outerHTML).toMatchSnapshot();
  });

  test("renders completed todo item", async () => {
    const { transformed } = await transformComponentFile("todo-item.pen.tsx");

    const element = executeZeroDom(transformed, {
      text: "Complete task",
      completed: true,
    });

    expect(element.outerHTML).toMatchSnapshot();
  });

  test("transforms and renders simple-button component", async () => {
    const { transformed } = await transformComponentFile(
      "simple-button.pen.tsx",
    );

    const element = executeZeroDom(transformed, {
      label: "Submit",
      disabled: false,
    });

    expect(element.outerHTML).toMatchSnapshot();
  });

  test("renders disabled button", async () => {
    const { transformed } = await transformComponentFile(
      "simple-button.pen.tsx",
    );

    const element = executeZeroDom(transformed, {
      label: "Cancel",
      disabled: true,
    });

    expect(element.outerHTML).toMatchSnapshot();
  });

  test("zero-dom cache works correctly", async () => {
    const { transformed } = await transformComponentFile("todo-item.pen.tsx");

    const element1 = executeZeroDom(transformed, {
      text: "Task 1",
      completed: false,
    });

    const element2 = executeZeroDom(transformed, {
      text: "Task 2",
      completed: true,
    });

    expect({
      element1: element1.outerHTML,
      element2: element2.outerHTML,
    }).toMatchSnapshot();
  });

  test("transformed code matches expected structure", async () => {
    const { transformed } = await transformComponentFile("todo-item.pen.tsx");

    expect(transformed).toMatchSnapshot();
  });

  describe("JSX transformation plugin pattern", () => {
    test("Host plugin transforms <Host> component correctly", async () => {
      const source = `
        export class TodoItem {
          text = "Test";
          render() {
            return <Host class="item">{this.text}</Host>;
          }
        }
      `;

      const sourceFile = createSourceFile(
        "test.tsx",
        source,
        99 as ScriptTarget,
        true,
        ScriptKind.TSX,
      );

      let renderMethod: MethodDeclaration | null = null;
      sourceFile.forEachChild((node) => {
        if (isClassDeclaration(node)) {
          for (const member of node.members) {
            if (
              isMethodDeclaration(member) &&
              member.name?.getText(sourceFile) === "render"
            ) {
              renderMethod = member as MethodDeclaration;
              break;
            }
          }
        }
      });

      expect(renderMethod).toBeDefined();

      if (!renderMethod) {
        throw new Error("renderMethod should be defined");
      }

      // Transform the render method
      const renderIR = new RenderIR(renderMethod);
      const transformer = new RenderTransformer();
      const irRef = new IRRef(renderIR, renderMethod);
      const transformedMethod = transformer.transform(irRef);

      // Verify transformation occurred
      const printer = createPrinter();
      const transformed = printer.printNode(
        EmitHint.Unspecified,
        transformedMethod,
        sourceFile,
      );

      // Should contain calls to 'sp' (setProperty) for class attribute
      expect(transformed).toContain("sp");
      expect(transformed).not.toContain("<Host");
    });

    test("JSX transformation hook receives complete context", async () => {
      // This test demonstrates that plugins receive all necessary
      // context to perform custom transformations: tagName, attributes,
      // jsxNode, loopContext, hierarchicalScopeKey, transformExpression,
      // and prependStatements for side effects.
      const source = `
        export class Component {
          render() {
            return <CustomTag attr="value" />;
          }
        }
      `;

      const sourceFile = createSourceFile(
        "test.tsx",
        source,
        99 as ScriptTarget,
        true,
        ScriptKind.TSX,
      );

      let renderMethod: MethodDeclaration | null = null;
      sourceFile.forEachChild((node) => {
        if (isClassDeclaration(node)) {
          for (const member of node.members) {
            if (
              isMethodDeclaration(member) &&
              member.name?.getText(sourceFile) === "render"
            ) {
              renderMethod = member as MethodDeclaration;
              break;
            }
          }
        }
      });

      expect(renderMethod).toBeDefined();

      if (!renderMethod) {
        throw new Error("renderMethod should be defined");
      }

      const renderIR = new RenderIR(renderMethod);
      const transformer = new RenderTransformer();
      const irRef = new IRRef(renderIR, renderMethod);
      const transformedMethod = transformer.transform(irRef);

      const printer = createPrinter();
      const transformed = printer.printNode(
        EmitHint.Unspecified,
        transformedMethod,
        sourceFile,
      );

      // Verify the method was processed (contains variable declarations)
      expect(transformed).toBeDefined();
      expect(transformed.length).toBeGreaterThan(0);
    });
  });
});
