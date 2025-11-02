import { createLog } from "@pencel/utils";
import ts, { factory } from "typescript";
import { inject } from "../../compiler/core/container.ts";
import { PencelPlugin, Plugins } from "../../compiler/core/plugin.ts";
import { SourceFiles } from "../../compiler/core/source-files.ts";
import type { ImportPreference } from "../../compiler/preprocessing/symbol-registry.ts";
import { SymbolRegistry } from "../../compiler/preprocessing/symbol-registry.ts";

const log = createLog("AngularOutput");

type AngularOutputOptions = {
  outputPath?: string;
  /**
   * TODO: Package name should come from base config or package.json by default.
   */
  packageName?: string;
};

export interface AngularOutputRegistry {
  angular: {
    class: AngularOutput;
    options: AngularOutputOptions;
  };
}

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
        userOptions.packageName ?? "@pencel/components",
      );
    });

    this.handle("derive", (hook) => {
      log(`Generate Framework bindings for file: ${hook.irr.node.fileName} to ${userOptions.outputPath}`);
    });
  }

  async #generateDirectives(
    fileIRs: Array<{ components: Array<{ className: string }> }>,
    outputPath: string,
    packageName: string,
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
            factory.createCallExpression(factory.createIdentifier("provideAppInitializer"), undefined, [
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
                        factory.createPropertyAccessExpression(factory.createIdentifier("console"), "log"),
                        undefined,
                        [factory.createStringLiteral("test")],
                      ),
                    ),
                  ],
                  true,
                ),
              ),
            ]),
          ),
        ],
        true,
      ),
    );

    // Create import preference for component symbols to use package-based imports
    const preference: ImportPreference = {
      style: "package",
      packageName,
      symbolOverrides: componentClassNames.map((symbol) => ({
        match: symbol,
        style: "package",
        packageName,
      })),
    };

    this.#sourceFiles.newFile(`${outputPath}/directives.ts`, [directivesExport, provideLibraryFunction], {
      preference,
    });

    log(`Generated directives.ts with ${componentClassNames.length} components from package ${packageName}`);
  }
}

Plugins.register("angular", AngularOutput, {
  outputPath: "out/angular",
});
