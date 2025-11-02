import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
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
import "../../../plugins.ts";
import { RenderTransformer } from "../../transformers/render.ts";
import { IRRef } from "../irri.ts";
import { RenderIR } from "../render.ts";

// --- E2E Test Suite ---
describe("RenderTransformer E2E with zero-dom", () => {
  // let window: Window;
  // let document: Document;

  // beforeEach(() => {
  //   window = new Window();
  //   document = window.document;
  // });

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
  describe("Automated fixture rendering", () => {
    const fixtureFiles = ["todo-item.pen.tsx", "simple-button.pen.tsx"];

    for (const fixture of fixtureFiles) {
      test(`${fixture} matches snapshot`, async () => {
        const { transformed } = await transformComponentFile(fixture);

        expect(transformed).toMatchSnapshot();
      });
    }
  });
});
