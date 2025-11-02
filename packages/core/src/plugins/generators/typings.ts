import { createLog } from "@pencel/utils";
import ts, { factory } from "typescript";
import { inject } from "../../compiler/core/container.ts";
import { PencelPlugin, Plugins } from "../../compiler/core/plugin.ts";
import { SourceFiles } from "../../compiler/core/source-files.ts";
import type { FileIR } from "../../compiler/ir/file.ts";
import type { ImplodeIRRefs } from "../../compiler/ir/irri.ts";

const log = createLog("ComponentTypings");

export interface ComponentTypingsOptions {
  path: string;
}

export interface ComponentTypingsRegistry {
  typings: {
    class: ComponentTypings;
    options: ComponentTypingsOptions;
  };
}

class ComponentTypings extends PencelPlugin {
  #sourceFiles = inject(SourceFiles);

  constructor(readonly userOptions: ComponentTypingsOptions) {
    super();

    this.handle("generate", async (hook) => {
      log(`Processing generate hook for ${hook.irs.length} IRs`);
      await this.#createAllTypings(hook.irs);
    });
  }

  async #createAllTypings(fileIRs: Array<ImplodeIRRefs<FileIR>>): Promise<void> {
    const globalDeclarations: ts.Statement[] = [];

    for (const fileIR of fileIRs) {
      for (const cir of fileIR.components) {
        if (cir.extends) {
          // Create Document.createElement interface
          const createElementMethodSignature = factory.createMethodSignature(
            undefined,
            factory.createIdentifier("createElement"),
            undefined,
            undefined,
            [
              factory.createParameterDeclaration(
                undefined,
                undefined,
                "tagName",
                undefined,
                factory.createLiteralTypeNode(factory.createStringLiteral(cir.extends)),
              ),
              factory.createParameterDeclaration(
                undefined,
                undefined,
                "options",
                undefined,
                factory.createTypeLiteralNode([
                  factory.createPropertySignature(
                    undefined,
                    factory.createIdentifier("is"),
                    undefined,
                    factory.createLiteralTypeNode(factory.createStringLiteral(cir.normalizedTag)),
                  ),
                ]),
              ),
            ],
            factory.createTypeReferenceNode(cir.className, undefined),
          );

          const createElementInterface = factory.createInterfaceDeclaration(
            [factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
            "Document",
            undefined,
            undefined,
            [createElementMethodSignature],
          );

          // Create setAttribute interface for the extended element
          const setAttributeMethodSignature = factory.createMethodSignature(
            undefined,
            factory.createIdentifier("setAttribute"),
            undefined,
            undefined,
            [
              factory.createParameterDeclaration(
                undefined,
                undefined,
                "name",
                undefined,
                factory.createLiteralTypeNode(factory.createStringLiteral("is")),
              ),
              factory.createParameterDeclaration(
                undefined,
                undefined,
                "value",
                undefined,
                factory.createLiteralTypeNode(factory.createStringLiteral(cir.normalizedTag)),
              ),
            ],
            factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
          );

          const setAttributeInterface = factory.createInterfaceDeclaration(
            [factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
            cir.heritage,
            undefined,
            undefined,
            [setAttributeMethodSignature],
          );

          globalDeclarations.push(createElementInterface, setAttributeInterface);
        } else {
          // Create HTMLElementTagNameMap interface property
          const htmlElementTagNameMapProperty = factory.createPropertySignature(
            undefined,
            factory.createStringLiteral(cir.normalizedTag),
            undefined,
            factory.createTypeReferenceNode(cir.className, undefined),
          );

          const htmlElementTagNameMapInterface = factory.createInterfaceDeclaration(
            [factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
            "HTMLElementTagNameMap",
            undefined,
            undefined,
            [htmlElementTagNameMapProperty],
          );

          // Create JSX.IntrinsicElements interface property
          const jsxIntrinsicElementProperty = factory.createPropertySignature(
            undefined,
            factory.createStringLiteral(cir.normalizedTag),
            undefined,
            factory.createTypeReferenceNode(`JSXElementAttributes<${cir.className}>`, undefined),
          );

          const jsxIntrinsicElementInterface = factory.createInterfaceDeclaration(
            [factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
            "IntrinsicElements",
            undefined,
            undefined,
            [jsxIntrinsicElementProperty],
          );

          const jsxNamespace = factory.createModuleDeclaration(
            [factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
            factory.createIdentifier("JSX"),
            factory.createModuleBlock([jsxIntrinsicElementInterface]),
            ts.NodeFlags.Namespace,
          );

          globalDeclarations.push(htmlElementTagNameMapInterface, jsxNamespace);
        }
      }
    }

    this.#sourceFiles.newFile(this.userOptions.path, globalDeclarations);

    log(`Created ${globalDeclarations.length} type declarations`);
  }
}

Plugins.register("typings", ComponentTypings, {
  path: "components.d.ts",
});
