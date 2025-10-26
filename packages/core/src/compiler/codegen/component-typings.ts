import { pascalCase } from "@pencel/utils";
import type { FileBuilder } from "ts-flattered";
import {
  $,
  $ref,
  global,
  interface_,
  namespace,
  objLiteral,
  param,
} from "ts-flattered";
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
  async createTypings(sf: ts.SourceFile & FileBuilder): Promise<void> {
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
        // [
        //   func("createElement", [
        //     param("tagName").initializer($(cir.ir.forIs)),
        //     param("options").initializer(
        //       objLiteral({
        //         is: cir.ir.tag,
        //       }),
        //     ),
        //   ]
        const createElementInterface = interface_("Document").addMethod(
          "createElement",
          [
            param("tagName", {
              initializer: $(cir.ir.forIs),
            }),
            param("options", {
              initializer: objLiteral({
                is: cir.ir.tag,
              }),
            }),
          ],
          $ref(cir.ir.className),
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
        //         ts.factory.createStringLiteral(cir.ir.forIs),
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
        //             ts.factory.createStringLiteral(cir.ir.tag),
        //           ),
        //         ),
        //       ]),
        //     ),
        //   ],
        //   ts.factory.createTypeReferenceNode(cir.ir.className, undefined),
        // ),

        // Create setAttribute interface for the extended element
        const setAttributeInterface = interface_(
          `HTML${pascalCase(cir.ir.forIs)}Element`,
          [
            (ts.factory.createMethodSignature as any)(
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
                    ts.factory.createStringLiteral(cir.ir.tag),
                  ),
                ),
              ],
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
            ),
          ],
        ).get();

        globalDeclarations.push(createElementInterface, setAttributeInterface);
      } else {
        globalDeclarations.push(
          interface_("HTMLElementTagNameMap").addProperty(
            $(cir.ir.tag),
            $ref(cir.ir.className),
          ),
          namespace("JSX", [
            interface_("IntrinsicElements").addProperty(
              $(cir.ir.tag),
              $ref(`JSXElementAttributes<${cir.ir.className}>`),
            ),
          ]),
        );
      }
    });

    const globalDecl = global(globalDeclarations);
    sf.addStatement(globalDecl);
  }
}
