import type { ComponentOptions } from "@pencel/runtime";
import type { SourceFile } from "ts-flattered";
import ts from "typescript";
import { PENCEL_DECORATORS } from "./constants.ts";

const DEFAULT_INHERITANCE = "HTMLElement";

export class ComponentDecoratorTransformer {
  // #styles = inject(Styles);

  async transform(sourceFile: SourceFile): Promise<void> {
    await sourceFile.updateClassesAsync(async (cls) => {
      // Ensure class extends HTMLElement if it doesn't extend any HTML element
      const heritage = cls.getHeritageClause(ts.SyntaxKind.ExtendsKeyword);
      const extendsHtmlElement = heritage?.getText().startsWith("HTML");

      if (!extendsHtmlElement) {
        cls.setExtends(DEFAULT_INHERITANCE);
      }

      await cls.updateDecoratorsByFilterAsync(
        {
          sourceFile,
          // TODO: Enable module checking again
          // module: PENCEL_RUNTIME_MODULE_NAME,
          name: PENCEL_DECORATORS.Component,
        },
        async (decorator) => {
          await decorator.updateArgumentObjectAsync(0, async (obj) => {
            // const componentOptions = obj.toRecord() as ComponentOptions;

            // const { styles, styleUrls } = await this.#styles.process(
            //   sourceFile,
            //   componentOptions,
            // );

            // obj.setMany({
            //   tag,
            //   styles,
            //   styleUrls,
            // } satisfies ComponentOptions);

            obj.remove("styleUrl" as keyof ComponentOptions);

            return obj;
          });

          return decorator;
        },
      );

      return cls;
    });
  }
}
