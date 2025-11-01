import { describe, expect, test } from "bun:test";
import { createSourceFile, ScriptKind, ScriptTarget } from "typescript";

import { SymbolCollector } from "../symbol-collector.ts";
import { SymbolRegistry } from "../symbol-registry.ts";

describe("SourcePreprocessor - Symbol Resolution", () => {
  const createTestFile = (fileName: string, code: string) =>
    createSourceFile(fileName, code, ScriptTarget.Latest, true, ScriptKind.TS);

  const collector = new SymbolCollector();

  test("should not collect exported function declarations", () => {
    const code = `export function provideLibrary() {
  return provideAppInitializer(() => {
    console.log("test");
  });
}`;

    const sf = createTestFile("directives.ts", code);
    const symbols = collector.collect(sf);

    // provideLibrary is declared as export, should not be collected
    expect(symbols.has("provideLibrary")).toBe(false);
    // Only the referenced external symbols should be collected
    expect(symbols.has("provideAppInitializer")).toBe(true);
  });

  test("should not collect exported const declarations", () => {
    const code = `export const DIRECTIVES = [
  ComponentA,
  ComponentB
];`;

    const sf = createTestFile("directives.ts", code);
    const symbols = collector.collect(sf);

    // DIRECTIVES is exported const declaration, should not be collected
    expect(symbols.has("DIRECTIVES")).toBe(false);
    // Referenced components should be collected
    expect(symbols.has("ComponentA")).toBe(true);
    expect(symbols.has("ComponentB")).toBe(true);
  });

  test("should filter self-imports when symbol module equals file path", () => {
    const registry = new SymbolRegistry();
    const filePath = "/project/src/out/directives.ts";

    // Register symbols as coming from this same file
    registry.registerInputSymbol("DIRECTIVES", filePath);
    registry.registerInputSymbol("provideLibrary", filePath);
    registry.registerInputSymbol("ComponentA", "/project/src/components/a.ts");

    // Simulate what SourcePreprocessor does
    const externalSymbols = new Set([
      "DIRECTIVES",
      "provideLibrary",
      "ComponentA",
    ]);
    const filtered = new Set<string>();

    for (const symbol of externalSymbols) {
      const config = registry.lookup(symbol);
      if (!config || config.module === filePath) {
        continue; // Skip self-imports
      }
      filtered.add(symbol);
    }

    expect(filtered.has("DIRECTIVES")).toBe(false);
    expect(filtered.has("provideLibrary")).toBe(false);
    expect(filtered.has("ComponentA")).toBe(true);
  });

  test("should require consumerPath for relative imports", () => {
    const registry = new SymbolRegistry();
    registry.registerInputSymbol("ComponentA", "/project/src/components/a.ts");

    // Try to lookup with relative style but no consumerPath
    expect(() => {
      registry.lookup("ComponentA", {
        style: "relative",
        // Missing consumerPath!
      });
    }).toThrow(/relative.*requires consumerPath/);
  });

  test("should compute relative paths when consumerPath provided", () => {
    const registry = new SymbolRegistry();
    registry.registerInputSymbol("ComponentA", "/project/src/components/a.ts");

    const config = registry.lookup("ComponentA", {
      style: "relative",
      consumerPath: "/project/src/out/angular/directives.ts",
    });

    expect(config).toBeDefined();
    if (config) {
      // Should be a relative path, not absolute
      expect(config.module).toContain("..");
      expect(config.module).not.toContain("/project/src/components/a.ts");
    }
  });

  test("should not transform well-known symbols with relative preference", () => {
    const registry = new SymbolRegistry();
    registry.registerWellKnown([
      {
        symbol: "provideAppInitializer",
        module: "@angular/core",
        importStyle: "named",
      },
    ]);

    const config = registry.lookup("provideAppInitializer", {
      style: "relative",
      consumerPath: "/project/src/out/directives.ts",
    });

    expect(config).toBeDefined();
    if (config) {
      // Well-known should stay as @angular/core, not be transformed to relative
      expect(config.module).toBe("@angular/core");
    }
  });
});
