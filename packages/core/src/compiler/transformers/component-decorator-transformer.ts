import type { ComponentOptions } from "@pencel/runtime";
import { ConsumerError, dashCase } from "@pencel/utils";
import type { SourceFile } from "ts-flattered";
import type { ComponentIR } from "../ir/component-ir.ts";
import { processStyles } from "../transforms/process-styles.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { PENCEL_DECORATORS } from "./constants.ts";

export class ComponentDecoratorTransformer {
  constructor(private componentIR: ComponentIR) {}

  async transform(sourceFile: SourceFile, _ctx: PencelContext): Promise<void> {
    await sourceFile.updateClassesAsync(async (cls) => {
      const className = cls.name?.text;
      if (!className) {
        throw new ConsumerError("Anonymous classes must have a tag.");
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

            const { styles, styleUrls } = await processStyles(
              sourceFile,
              componentOptions,
            );

            const tag = dashCase(className);

            obj.setMany({
              tag,
              styles,
              styleUrls,
            } satisfies ComponentOptions);

            obj.remove("styleUrl" as keyof ComponentOptions);

            // Build IR during transformation
            this.componentIR.setComponentInfo(tag, className);

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

            this.componentIR.setStyles(stylesArray, styleUrlsArray);

            return obj;
          });

          return decorator;
        },
      );

      return cls;
    });
  }
}
