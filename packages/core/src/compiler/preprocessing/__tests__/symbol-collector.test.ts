import { describe, expect, test } from "bun:test";
import { createSourceFile, ScriptKind, ScriptTarget } from "typescript";
import { SymbolCollector } from "../symbol-collector.ts";

describe("SymbolCollector", () => {
  const createTestFile = (code: string) =>
    createSourceFile("test.ts", code, ScriptTarget.Latest, true, ScriptKind.TS);

  const collector = new SymbolCollector();

  test("should not collect symbols from export specifiers", () => {
    const code = `export { TestFeatures } from "./test-features.pen";
export { HTMLPenDetailsElement } from "./pen-details.pen";`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    expect(symbols.size).toBe(0);
  });

  test("should not collect symbols from import specifiers", () => {
    const code = `import { TestFeatures } from "./test-features.pen";
import { HTMLPenDetailsElement } from "./pen-details.pen";`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    expect(symbols.size).toBe(0);
  });

  test("should not collect symbols from named imports", () => {
    const code = `import { Component, Prop } from "@pencel/runtime";`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    expect(symbols.size).toBe(0);
  });

  test("should not collect symbols from namespace imports", () => {
    const code = `import * as ts from "typescript";`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    expect(symbols.size).toBe(0);
  });

  test("should collect symbols used in code", () => {
    const code = `const x = someSymbol + anotherSymbol;`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    expect(symbols.has("someSymbol")).toBe(true);
    expect(symbols.has("anotherSymbol")).toBe(true);
  });

  test("should not collect locally declared symbols", () => {
    const code = `const myVar = 42;
function myFunc() {}
class MyClass {}`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    expect(symbols.has("myVar")).toBe(false);
    expect(symbols.has("myFunc")).toBe(false);
    expect(symbols.has("MyClass")).toBe(false);
  });

  test("should collect symbols used but not declared", () => {
    const code = `const x = externalSymbol + anotherExternal;
function foo(param) {
  return param + anotherExternal;
}`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    expect(symbols.has("externalSymbol")).toBe(true);
    expect(symbols.has("anotherExternal")).toBe(true);
    expect(symbols.has("foo")).toBe(false); // function declaration, shouldn't collect
  });

  test("should not collect built-in keywords", () => {
    const code = `const arr = [1, 2, 3];
const obj = {};
const prom = Promise.resolve();
const err = new Error("test");
const bool = true;
const n = null;`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    expect(symbols.has("Array")).toBe(false);
    expect(symbols.has("Object")).toBe(false);
    expect(symbols.has("Promise")).toBe(false);
    expect(symbols.has("Error")).toBe(false);
    expect(symbols.has("true")).toBe(false);
    expect(symbols.has("null")).toBe(false);
  });

  test("should handle barrel file (pure re-exports) without adding symbols", () => {
    const code = `// auto-generated barrel file
export { ComponentA } from "./components/a.pen";
export { ComponentB } from "./components/b.pen";
export { ComponentC } from "./components/c.pen";`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    // Barrel files should not collect any symbols since they only re-export
    expect(symbols.size).toBe(0);
  });

  test("should handle mixed imports and re-exports", () => {
    const code = `import { RuntimeHelper } from "@pencel/runtime";
export { ComponentA } from "./components/a.pen";

const result = RuntimeHelper.process(data);`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    // RuntimeHelper is already imported, data is external
    expect(symbols.has("RuntimeHelper")).toBe(false);
    expect(symbols.has("data")).toBe(true);
  });

  test("should collect symbols from property access chains", () => {
    const code = `const value = externalObj.method();`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    // Both externalObj and method are collected as identifiers in the AST
    expect(symbols.has("externalObj")).toBe(true);
    expect(symbols.has("method")).toBe(true);
  });

  test("should collect symbols from function calls", () => {
    const code = `const result = helperFunction(arg1, arg2);`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    expect(symbols.has("helperFunction")).toBe(true);
    expect(symbols.has("arg1")).toBe(true);
    expect(symbols.has("arg2")).toBe(true);
  });

  test("should not collect symbols from export specifiers with renaming", () => {
    const code = `export { OldName as NewName } from "./module";`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    expect(symbols.size).toBe(0);
  });

  test("should not collect symbols from import specifiers with renaming", () => {
    const code = `import { OldName as NewName } from "./module";`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    expect(symbols.size).toBe(0);
  });

  test("should not collect symbols from barrel file with re-exports (regression test)", () => {
    // This is the specific case that was failing: barrel files with multiple re-exports
    // were incorrectly having import statements added for the exported symbols
    const code = `// auto-generated by pencel
export { TestFeatures } from "./components/test-features.pen";
export { HTMLPenDetailsElement } from "./components/pen-details.pen";
export { PenCardElement } from "./components/pen-card.pen";
export { TodoMvcElement } from "./components/todo-mvc.pen";
export { HTMLPenButtonElement } from "./components/pen-button.pen";
export { PenInputElement } from "./components/pen-input.pen";`;

    const sf = createTestFile(code);
    const symbols = collector.collect(sf);

    // The barrel file should not collect any symbols to import
    // All symbols in the file are being re-exported, not used as references
    expect(symbols.size).toBe(0);
    expect(symbols.has("TestFeatures")).toBe(false);
    expect(symbols.has("HTMLPenDetailsElement")).toBe(false);
    expect(symbols.has("PenCardElement")).toBe(false);
    expect(symbols.has("TodoMvcElement")).toBe(false);
    expect(symbols.has("HTMLPenButtonElement")).toBe(false);
    expect(symbols.has("PenInputElement")).toBe(false);
  });
});
