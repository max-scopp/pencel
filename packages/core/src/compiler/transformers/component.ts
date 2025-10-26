import { throwError } from "@pencel/utils";
import { type ClassDeclaration, factory, isCallExpression } from "typescript";
import { recordToObjectLiteral } from "../../ts-utils/recordToObjectLiteral.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { inject } from "../core/container.ts";
import { ComponentIR } from "../ir/component.ts";
import type { IRRef } from "../ir/ref.ts";
import { PropertyTransformer } from "./props.ts";
import { Transformer } from "./transformer.ts";

export class ComponentTransformer extends Transformer(ComponentIR) {
  #propsTransformer = inject(PropertyTransformer);

  override transform(irr: IRRef<ComponentIR, ClassDeclaration>) {
    const decorator = singleDecorator(irr.node, "Component");
    const callExpression = isCallExpression(decorator.expression)
      ? decorator.expression
      : throwError("Decorator is not called");

    // Update the decorator with the normalized IR data
    factory.updateCallExpression(
      callExpression,
      callExpression.expression,
      callExpression.typeArguments,
      [
        recordToObjectLiteral({
          tag: irr.ir.tag,
          extends: irr.ir.extends,
          forIs: irr.ir.forIs,
          styles: irr.ir.styles,
          styleUrls: irr.ir.styleUrls,
        }),
      ],
    );

    // Transform properties using the IR
    irr.ir.props.forEach((pirr) => {
      this.#propsTransformer.transform(pirr);
    });
  }
}
