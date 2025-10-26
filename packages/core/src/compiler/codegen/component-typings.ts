import { pascalCase } from "@pencel/utils";
import ts from "typescript";
import { inject } from "../core/container.ts";
import { IRIndex } from "../ir/ref.ts";

export class ComponentTypings {
  readonly #ir = inject(IRIndex);

  /*
  Declares global or module-level TypeScript types for custom web components used in your project.
  Provides type definitions for each component, including their properties, events, and methods.
  Enables TypeScript to recognize and type-check custom elements in JSX/TSX files.
  Ensures that when you use custom components in your code, you get proper IntelliSense and compile-time validation for their props and events.
  */
  async createTypings(sf: ts.SourceFile): Promise<void> {
    const cirs = this.#ir.firstIrr(
      "File",
      (irr) => irr.fileName === sf.fileName,
    );

    console.log(
      "Creating typings for components:",
      cirs.ir.components.map((c) => ({
        tag: c.ir.tag,
        className: c.ir.className,
      })),
    );

    /*
  interface Document {
    createElement(
      tagName: 'button',
      options: { is: 'pencil-button' }
    ): HTMLPencelButton;
  }
  
  interface HTMLButtonElement {
    setAttribute(name: "is", value: "pencil-button"): void;
  }*/

    // Create interface declarations for components
    const globalDeclarations: ts.Statement[] = [];

    cirs.ir.components.forEach((cir) => {
      if (cir.ir.forIs) {
        // Create Document.createElement interface
        const createElementMethodSignature = ts.factory.createMethodSignature(
          undefined,
          ts.factory.createIdentifier("createElement"),
          undefined,
          undefined,
          [
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              "tagName",
              undefined,
              ts.factory.createLiteralTypeNode(
                ts.factory.createStringLiteral(cir.ir.forIs),
              ),
            ),
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              "options",
              undefined,
              ts.factory.createTypeLiteralNode([
                ts.factory.createPropertySignature(
                  undefined,
                  ts.factory.createIdentifier("is"),
                  undefined,
                  ts.factory.createLiteralTypeNode(
                    ts.factory.createStringLiteral(cir.ir.tag),
                  ),
                ),
              ]),
            ),
          ],
          ts.factory.createTypeReferenceNode(cir.ir.className, undefined),
        );

        const createElementInterface = ts.factory.createInterfaceDeclaration(
          [ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
          "Document",
          undefined,
          undefined,
          [createElementMethodSignature],
        );

        // Create setAttribute interface for the extended element
        const setAttributeMethodSignature = ts.factory.createMethodSignature(
          undefined,
          ts.factory.createIdentifier("setAttribute"),
          undefined,
          undefined,
          [
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              "name",
              undefined,
              ts.factory.createLiteralTypeNode(
                ts.factory.createStringLiteral("is"),
              ),
            ),
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              "value",
              undefined,
              ts.factory.createLiteralTypeNode(
                ts.factory.createStringLiteral(cir.ir.tag),
              ),
            ),
          ],
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
        );

        const setAttributeInterface = ts.factory.createInterfaceDeclaration(
          [ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
          `HTML${pascalCase(cir.ir.forIs)}Element`,
          undefined,
          undefined,
          [setAttributeMethodSignature],
        );

        globalDeclarations.push(createElementInterface, setAttributeInterface);
      } else {
        // Create HTMLElementTagNameMap interface property
        const htmlElementTagNameMapProperty =
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createStringLiteral(cir.ir.tag),
            undefined,
            ts.factory.createTypeReferenceNode(cir.ir.className, undefined),
          );

        const htmlElementTagNameMapInterface =
          ts.factory.createInterfaceDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
            "HTMLElementTagNameMap",
            undefined,
            undefined,
            [htmlElementTagNameMapProperty],
          );

        // Create JSX.IntrinsicElements interface property
        const jsxIntrinsicElementProperty = ts.factory.createPropertySignature(
          undefined,
          ts.factory.createStringLiteral(cir.ir.tag),
          undefined,
          ts.factory.createTypeReferenceNode(
            `JSXElementAttributes<${cir.ir.className}>`,
            undefined,
          ),
        );

        const jsxIntrinsicElementInterface =
          ts.factory.createInterfaceDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
            "IntrinsicElements",
            undefined,
            undefined,
            [jsxIntrinsicElementProperty],
          );

        const jsxNamespace = ts.factory.createModuleDeclaration(
          [ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
          ts.factory.createIdentifier("JSX"),
          ts.factory.createModuleBlock([jsxIntrinsicElementInterface]),
          ts.NodeFlags.Namespace,
        );

        globalDeclarations.push(htmlElementTagNameMapInterface, jsxNamespace);
      }
    });

    // Add all declarations to the source file
    const sourceFile = sf as ts.SourceFile & {
      statements: ts.NodeArray<ts.Statement>;
    };
    sourceFile.statements = ts.factory.createNodeArray([
      ...(sf.statements || []),
      ...globalDeclarations,
    ]);
  }
}
