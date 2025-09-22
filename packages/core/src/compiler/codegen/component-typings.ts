import type { FileBuilder } from "ts-flattered";
import { namespace } from "ts-flattered";
import ts from "typescript";

export class ComponentTypings {
  //   readonly #ir = inject(IR);

  /*
  Declares global or module-level TypeScript types for custom web components used in your project.
Provides type definitions for each component, including their properties, events, and methods.
Enables TypeScript to recognize and type-check custom elements in JSX/TSX files.
Ensures that when you use custom components in your code, you get proper IntelliSense and compile-time validation for their props and events.
*/
  createTypings(sf: ts.SourceFile & FileBuilder): void {
    // Create a namespace declaration (assuming you have a builder called `namespace_`)
    const ns = namespace("MyNamespace").addStatement(
      ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              "y",
              undefined,
              undefined,
              ts.factory.createNumericLiteral(42),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      ),
    );

    sf.addStatement(ns);
  }
}
