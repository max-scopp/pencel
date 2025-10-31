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
          (el as any as HTMLInputElement).checked = boolValue;
          isSettingProperty = false;
        } else if (name === "disabled") {
          // Boolean property - only set to true if value is truthy
          const boolValue =
            value === "true" || (value as unknown) === true || value === "";
          isSettingProperty = true;
          (el as any as HTMLButtonElement).disabled = boolValue;
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
      parent: HTMLElement | DocumentFragment,
      children: (Node | string | boolean | number | null | undefined)[],
    ) {
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

      const old = parent.childNodes;
      const max = Math.max(old.length, childNodes.length);
      for (let i = 0; i < max; i++) {
        const w = childNodes[i];
        const h = old[i];
        if (!w) {
          if (h) parent.removeChild(h);
          continue;
        }
        if (h === w) continue;
        if (h) parent.replaceChild(w as any, h);
        else parent.appendChild(w as any);
      }
    }

    // Execute the transformed render function
    // Extract just the IIFE body (the function inside the return statement)
    // Pattern: return function () { BODY }();
    const iifeMatch = transformedCode.match(
      /return\s+function\s*\(\)\s*\{([\s\S]*)\}\(\);/,
    );
    if (!iifeMatch) {
      throw new Error("Could not extract IIFE body from transformed code");
    }

    const renderFunction = new Function(
      "once",
      "setChildren",
      "document",
      `
      ${iifeMatch[1]}
      `,
    );

    const result = renderFunction.call(
      componentInstance,
      once,
      setChildrenPatched,
      documentProxy,
    );

    return result as HTMLElement;
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
});
