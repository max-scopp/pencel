import type { PropOptions } from "@pencel/runtime";
import {
  computeConstructorType,
  findDecorators,
  type SourceFile,
} from "ts-flattered";
import type ts from "typescript";
import type { ComponentIR, ComponentProperty } from "../ir/component-ir.ts";
import type { PencelContext } from "../types/compiler-types.ts";
import { PENCEL_DECORATORS } from "./constants.ts";

export class PropsDecoratorTransformer {
  constructor(
    private program: ts.Program,
    private componentIR: ComponentIR,
  ) {}

  async transform(sourceFile: SourceFile, _ctx: PencelContext): Promise<void> {
    await sourceFile.updateClassesAsync(async (cls) => {
      await cls.updatePropertiesByFilter(
        (prop) =>
          findDecorators(prop, {
            sourceFile,
            // TODO: Enable module checking again
            // module: PENCEL_RUNTIME_MODULE_NAME,
            name: PENCEL_DECORATORS.Prop,
          }).length > 0,
        (prop) => {
          prop.updateDecoratorByName(PENCEL_DECORATORS.Prop, (decorator) => {
            decorator.updateArgumentObject(0, (obj) => {
              const propType = computeConstructorType(
                this.program.getTypeChecker(),
                prop.type ?? prop.initializer,
              );

              obj.setMany({
                type: propType,
              } satisfies { [key in keyof PropOptions]: unknown });

              // Build IR for this property
              const propNameText =
                typeof prop.name === "object" && "text" in prop.name
                  ? prop.name.text
                  : prop.name?.toString();

              if (propNameText) {
                const componentProperty: ComponentProperty = {
                  name: propNameText,
                  type: typeof propType === "string" ? propType : "unknown",
                  isRequired: !prop.questionToken && !prop.initializer,
                  decoratorType: "Prop",
                  defaultValue: prop.initializer?.getText?.() || undefined,
                };

                this.componentIR.properties.push(componentProperty);
              }

              return obj;
            });

            return decorator;
          });

          return prop;
        },
      );

      return cls;
    });
  }
}
