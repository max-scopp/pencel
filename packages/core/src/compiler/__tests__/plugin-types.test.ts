import { describe, expect, test } from "bun:test";
import type { PluginDef, PluginDefs } from "../types/plugins.ts";

/**
 * Type-only test to ensure PluginDef and PluginDefs accept expected forms.
 */

describe("Plugin Type System", () => {
  test("PluginDef union accepts string and object forms", () => {
    const stringDef: PluginDef = "scss";
    const objectDef: PluginDef = {
      name: "angular",
      options: { outputPath: "dist/angular" },
    };
    const noOptsDef: PluginDef = { name: "css" };

    expect(stringDef).toMatchSnapshot();
    expect(objectDef).toMatchSnapshot();
    expect(noOptsDef).toMatchSnapshot();
  });

  test("PluginDefs array accepts mixed plugin definitions", () => {
    const defs: PluginDefs = [
      "scss",
      { name: "angular", options: { outputPath: "dist/angular" } },
      { name: "components", options: { path: "components.ts" } },
    ];

    expect(defs).toMatchSnapshot();
    expect(defs.length).toBe(3);
  });
});
