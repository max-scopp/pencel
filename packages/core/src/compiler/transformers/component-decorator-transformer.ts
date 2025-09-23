import type { ComponentOptions } from "@pencel/runtime";
import { dashCase, getTagByExtendsString, throwError } from "@pencel/utils";
import { pascalCase } from "ng-openapi";
import type { SourceFile } from "ts-flattered";
import ts from "typescript";
import { Config } from "../config/config.ts";
import { inject } from "../core/container.ts";
import type { ComponentIR } from "../ir/component-ir.ts";
import { Styles } from "../transforms/styles.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { PENCEL_DECORATORS } from "./constants.ts";

const DEFAULT_INHERITANCE = "HTMLElement";

export class ComponentDecoratorTransformer {
  #config = inject(Config);
  #styles = inject(Styles);

  constructor(private componentIR: ComponentIR) {}

  async transform(sourceFile: SourceFile, _ctx: PencelContext): Promise<void> {
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
            const componentOptions = obj.toRecord() as ComponentOptions;

            const { styles, styleUrls } = await this.#styles.process(
              sourceFile,
              componentOptions,
            );

            const tag =
              componentOptions?.tag ??
              dashCase(
                cls.className ??
                  throwError("Anonymous classes must have a tag."),
              );

            const className = cls.className ?? pascalCase(tag);

            const htmlSuffix = `HTML${pascalCase(this.#config.config.runtime.tagNamespace ?? "")}`;
            const fullClassName = `${htmlSuffix}${className}`;

            if (!className.startsWith(htmlSuffix)) {
              cls.rename(fullClassName);
            }

            this.componentIR.tag = tag;
            this.componentIR.className =
              cls.className ??
              throwError("Internal error: class must have a name by now.");

            this.componentIR.extends =
              heritage?.getText() ?? DEFAULT_INHERITANCE;
            this.componentIR.forIs = getTagByExtendsString(heritage?.getText());

            obj.setMany({
              tag,
              styles,
              styleUrls,
            } satisfies ComponentOptions);

            obj.remove("styleUrl" as keyof ComponentOptions);

            // Convert to string arrays for IR
            const stylesArray = Array.isArray(styles)
              ? styles.filter((s): s is string => typeof s === "string")
              : typeof styles === "string"
                ? [styles]
                : [];
            const styleUrlsArray = Array.isArray(styleUrls)
              ? styleUrls.filter((s): s is string => typeof s === "string")
              : typeof styleUrls === "string"
                ? [styleUrls]
                : [];

            this.componentIR.styles = stylesArray;
            this.componentIR.styleUrls = styleUrlsArray;

            return obj;
          });

          return decorator;
        },
      );

      return cls;
    });
  }
}
