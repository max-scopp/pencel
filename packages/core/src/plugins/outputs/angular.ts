import { createLog } from "@pencel/utils";
import ts, { factory } from "typescript";
import { inject } from "../../compiler/core/container.ts";
import { PencelPlugin, Plugins } from "../../compiler/core/plugin.ts";
import { SourceFiles } from "../../compiler/core/source-files.ts";
import { SymbolRegistry } from "../../compiler/preprocessing/symbol-registry.ts";

const log = createLog("AngularOutput");

declare module "../../compiler/types/plugins.ts" {
  interface PluginRegistry {
    angular: {
      class: AngularOutput;
      options: AngularOutputOptions;
    };
  }
}

type AngularOutputOptions = {
  outputPath?: string;
};

class AngularOutput extends PencelPlugin {
  readonly #registry = inject(SymbolRegistry);
  readonly #sourceFiles = inject(SourceFiles);

  constructor(userOptions: AngularOutputOptions) {
    super();

    this.#registry.registerWellKnown([
      {
        symbol: "provideAppInitializer",
        module: "@angular/core",
        importStyle: "named",
      },
    ]);

    this.handle("generate", async (hook) => {
      await this.#generateDirectives(
        hook.irs,
        userOptions.outputPath ?? "out/angular",
      );
    });

    this.handle("derive", (hook) => {
      log(
        `Generate Framework bindings for file: ${hook.irr.node.fileName} to ${
          userOptions.outputPath
        }`,
      );
    });
  }

  async #generateDirectives(
    fileIRs: Array<{ components: Array<{ className: string }> }>,
    outputPath: string,
  ): Promise<void> {
    // Collect all component class names from all files
    const componentClassNames: string[] = [];
    for (const fileIR of fileIRs) {
      for (const componentIR of fileIR.components) {
        componentClassNames.push(componentIR.className);
      }
    }

    if (componentClassNames.length === 0) {
      log("No components found, skipping directives generation");
      return;
    }

    // Create export statement for DIRECTIVES array
    const directivesExport = factory.createVariableStatement(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            "DIRECTIVES",
            undefined,
            undefined,
            factory.createArrayLiteralExpression(
              componentClassNames.map((name) => factory.createIdentifier(name)),
              true,
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );

    // Create provideLibrary function
    const provideLibraryFunction = factory.createFunctionDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      "provideLibrary",
      undefined,
      [],
      undefined,
      factory.createBlock(
        [
          factory.createReturnStatement(
            factory.createCallExpression(
              factory.createIdentifier("provideAppInitializer"),
              undefined,
              [
                factory.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  factory.createBlock(
                    [
                      factory.createExpressionStatement(
                        factory.createCallExpression(
                          factory.createPropertyAccessExpression(
                            factory.createIdentifier("console"),
                            "log",
                          ),
                          undefined,
                          [factory.createStringLiteral("test")],
                        ),
                      ),
                    ],
                    true,
                  ),
                ),
              ],
            ),
          ),
        ],
        true,
      ),
    );

    this.#sourceFiles.newFile(`${outputPath}/directives.ts`, [
      directivesExport,
      provideLibraryFunction,
    ]);

    log(
      `Generated directives.ts with ${componentClassNames.length} components: ${componentClassNames.join(", ")}`,
    );
  }
}

Plugins.register("angular", AngularOutput, {
  outputPath: "out/angular",
});
