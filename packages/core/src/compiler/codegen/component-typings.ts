import { pascalCase } from "ng-openapi";
import type { FileBuilder } from "ts-flattered";
import { $, $ref, global, interface_, objLiteral, param } from "ts-flattered";
import ts from "typescript";
import { inject } from "../core/container.ts";
import { IR } from "../ir/ir.ts";

export class ComponentTypings {
  readonly #ir = inject(IR);

  /*
  Declares global or module-level TypeScript types for custom web components used in your project.
  Provides type definitions for each component, including their properties, events, and methods.
  Enables TypeScript to recognize and type-check custom elements in JSX/TSX files.
  Ensures that when you use custom components in your code, you get proper IntelliSense and compile-time validation for their props and events.
  */
  async createTypings(sf: ts.SourceFile & FileBuilder): Promise<void> {
    const cirs = this.#ir.getIRsForSourceFile(sf);

    if (cirs.length === 0) {
      return;
    }

    console.log(
      "Creating typings for components:",
      cirs.map((c) => ({ tag: c.tag, className: c.className })),
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
    const interfaceDeclarations: ts.InterfaceDeclaration[] = [];

    cirs.forEach((cir) => {
      if (cir.forIs) {
        // Create Document.createElement interface
        // [
        //   func("createElement", [
        //     param("tagName").initializer($(cir.forIs)),
        //     param("options").initializer(
        //       objLiteral({
        //         is: cir.tag,
        //       }),
        //     ),
        //   ]
        const createElementInterface = interface_("Document").addMethod(
          "createElement",
          [
            param("tagName", {
              initializer: $(cir.forIs),
            }),
            param("options", {
              initializer: objLiteral({
                is: cir.tag,
              }),
            }),
          ],
          $ref(cir.className),
        );

        // ts.factory.createMethodSignature(
        //   undefined,
        //   undefined,
        //   ts.factory.createIdentifier("createElement"),
        //   undefined,
        //   [
        //     ts.factory.createParameterDeclaration(
        //       undefined,
        //       undefined,
        //       "tagName",
        //       undefined,
        //       ts.factory.createLiteralTypeNode(
        //         ts.factory.createStringLiteral(cir.forIs),
        //       ),
        //     ),
        //     ts.factory.createParameterDeclaration(
        //       undefined,
        //       undefined,
        //       "options",
        //       undefined,
        //       ts.factory.createTypeLiteralNode([
        //         ts.factory.createPropertySignature(
        //           undefined,
        //           ts.factory.createIdentifier("is"),
        //           undefined,
        //           ts.factory.createLiteralTypeNode(
        //             ts.factory.createStringLiteral(cir.tag),
        //           ),
        //         ),
        //       ]),
        //     ),
        //   ],
        //   ts.factory.createTypeReferenceNode(cir.className, undefined),
        // ),

        // Create setAttribute interface for the extended element
        const setAttributeInterface = interface_(
          `HTML${pascalCase(cir.forIs)}Element`,
          [
            ts.factory.createMethodSignature(
              undefined,
              undefined,
              ts.factory.createIdentifier("setAttribute"),
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
                    ts.factory.createStringLiteral(cir.tag),
                  ),
                ),
              ],
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
            ),
          ],
        ).get();

        interfaceDeclarations.push(
          createElementInterface,
          setAttributeInterface,
        );
      } else {
        // For regular custom elements, add to HTMLElementTagNameMap
        const htmlElementTagNameMap = interface_(
          "HTMLElementTagNameMap",
        ).addProperty($(cir.tag), $ref(cir.className));

        interfaceDeclarations.push(htmlElementTagNameMap);
      }
    });

    const globalDecl = global(interfaceDeclarations);
    sf.addStatement(globalDecl);
  }
}
