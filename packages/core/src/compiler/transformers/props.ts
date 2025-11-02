import { throwError } from "@pencel/utils";
import { factory, getDecorators, isCallExpression, type PropertyDeclaration } from "typescript";
import { recordToObjectLiteral } from "../../ts-utils/recordToObjectLiteral.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import type { IRRef } from "../ir/irri.ts";
import { PropertyIR } from "../ir/prop.ts";
import { Transformer } from "./transformer.ts";

export class PropertyTransformer extends Transformer<PropertyDeclaration>(PropertyIR) {
  override transform(irr: IRRef<PropertyIR, PropertyDeclaration>) {
    const decorator = singleDecorator(irr.node, "Prop");
    const callExpression = isCallExpression(decorator.expression)
      ? decorator.expression
      : throwError("Decorator is not called");

    const updatedCallExpression = factory.updateCallExpression(
      callExpression,
      callExpression.expression,
      callExpression.typeArguments,
      [
        recordToObjectLiteral({
          ...irr.ir,
        }),
      ],
    );

    // Create updated decorator with the new call expression
    const updatedDecorator = factory.updateDecorator(decorator, updatedCallExpression);

    // Get all decorators and replace the updated one
    const decorators = getDecorators(irr.node);
    if (!decorators) return irr.node;

    const updatedDecorators = decorators.map((d) => (d === decorator ? updatedDecorator : d));

    return factory.createPropertyDeclaration(
      updatedDecorators,
      irr.node.name,
      irr.node.questionToken,
      irr.node.type,
      irr.node.initializer,
    );
  }
}
