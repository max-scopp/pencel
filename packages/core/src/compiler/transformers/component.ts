import type { ComponentOptions } from "@pencel/runtime";
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
import { RenderTransformer } from "./render.ts";
import { Transformer } from "./transformer.ts";

export class ComponentTransformer extends Transformer(ComponentIR) {
  #propsTransformer = inject(PropertyTransformer);
  #renderTransformer = inject(RenderTransformer);

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
          styles: irr.ir.styles,
          styleUrls: irr.ir.styleUrls,
        } satisfies ComponentOptions),
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

    // Transform render method if it exists
    let updatedMembers = irr.node.members;
    if (irr.ir.render) {
      updatedMembers = factory.createNodeArray(
        irr.node.members.map((member) => {
          if (member === irr.ir.render?.node) {
            return this.#renderTransformer.transform(irr.ir.render);
          }
          return member;
        }),
      );
    }

    // Combine modifiers and decorators
    const combinedModifiers = [
      ...(updatedDecorators ?? []),
      ...(irr.node.modifiers ?? []),
    ];

    return factory.createClassDeclaration(
      combinedModifiers,
      irr.node.name,
      irr.node.typeParameters,
      irr.node.heritageClauses,
      updatedMembers,
    );
  }
}
