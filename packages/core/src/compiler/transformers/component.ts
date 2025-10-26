import { throwError } from "@pencel/utils";
import {
  type ClassDeclaration,
  factory,
  getDecorators,
  isCallExpression,
} from "typescript";
import { recordToObjectLiteral } from "../../ts-utils/recordToObjectLiteral.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { inject } from "../core/container.ts";
import { ComponentIR } from "../ir/component.ts";
import type { IRRef } from "../ir/irri.ts";
import { PropertyTransformer } from "./props.ts";
import { Transformer } from "./transformer.ts";

export class ComponentTransformer extends Transformer(ComponentIR) {
  #propsTransformer = inject(PropertyTransformer);

  override transform(irr: IRRef<ComponentIR, ClassDeclaration>) {
    const decorator = singleDecorator(irr.node, "Component");
    const callExpression = isCallExpression(decorator.expression)
      ? decorator.expression
      : throwError("Decorator is not called");

    const updatedCallExpression = factory.updateCallExpression(
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

    // Create updated decorator with the new call expression
    const updatedDecorator = factory.updateDecorator(
      decorator,
      updatedCallExpression,
    );

    // Get all decorators and replace the updated one
    const decorators = getDecorators(irr.node);
    const updatedDecorators = decorators
      ? decorators.map((d) => (d === decorator ? updatedDecorator : d))
      : [updatedDecorator];

    // Transform properties using the IR
    irr.ir.props.forEach((pirr) => {
      const updatedNode = this.#propsTransformer.transform(pirr);
      // Update the node reference if it changed
      if (updatedNode !== pirr.node) {
        pirr.node = updatedNode;
      }
    });

    return factory.createClassDeclaration(
      updatedDecorators,
      irr.node.name,
      irr.node.typeParameters,
      irr.node.heritageClauses,
      irr.node.members,
    );
  }
}
