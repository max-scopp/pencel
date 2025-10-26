import { throwError } from "@pencel/utils";
import {
  factory,
  isCallExpression,
  type PropertyDeclaration,
} from "typescript";
import { recordToObjectLiteral } from "../../ts-utils/recordToObjectLiteral.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import type { IRRef } from "../ir/irri.ts";
import { PropertyIR } from "../ir/prop.ts";
import { Transformer } from "./transformer.ts";

export class PropertyTransformer extends Transformer(PropertyIR) {
  override transform(irr: IRRef<PropertyIR, PropertyDeclaration>) {
    const decorator = singleDecorator(irr.node, "Prop");
    const callExpression = isCallExpression(decorator.expression)
      ? decorator.expression
      : throwError("Decorator is not called");

    factory.updateCallExpression(
      callExpression,
      callExpression.expression,
      callExpression.typeArguments,
      [
        recordToObjectLiteral({
          ...irr.ir,
        }),
      ],
    );
  }
}
