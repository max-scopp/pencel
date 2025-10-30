import type { ComponentOptions } from "@pencel/runtime";
import { throwError } from "@pencel/utils";
import {
  type ClassDeclaration,
  factory,
  getDecorators,
  isCallExpression,
  isDecorator,
  isIdentifier,
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
      ? [
          ...decorators.filter((d) => {
            if (!isCallExpression(d.expression)) return true;
            const expr = d.expression.expression;
            return !isIdentifier(expr) || expr.text !== "Component";
          }),
          updatedDecorator,
        ]
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

      // Add #lex field if it doesn't already exist
      if (!this.#hasLexField(updatedMembers)) {
        const lexField = factory.createPropertyDeclaration(
          undefined,
          factory.createIdentifier("#lex"),
          undefined,
          undefined,
          factory.createCallExpression(
            factory.createIdentifier("createLexerCache"),
            undefined,
            [],
          ),
        );
        updatedMembers = factory.createNodeArray([lexField, ...updatedMembers]);
      }
    }

    // Combine modifiers (excluding decorators) and updated decorators
    const nonDecoratorModifiers = (irr.node.modifiers ?? []).filter(
      (modifier) => !isDecorator(modifier),
    );

    const combinedModifiers = [
      ...(updatedDecorators ?? []),
      ...nonDecoratorModifiers,
    ];

    return factory.createClassDeclaration(
      combinedModifiers,
      irr.node.name,
      irr.node.typeParameters,
      irr.node.heritageClauses,
      updatedMembers,
    );
  }

  #hasLexField(members: ReturnType<typeof factory.createNodeArray>): boolean {
    return members.some((member) => {
      const memberWithName = member as { name?: { text?: string } | string };
      const name = memberWithName.name;
      if (typeof name === "string") {
        return name === "#lex";
      }
      return name?.text === "#lex";
    });
  }
}
