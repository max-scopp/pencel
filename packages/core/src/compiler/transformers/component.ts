import { type ComponentOptions, INTERNALS } from "@pencel/runtime";
import { createWarn, throwError } from "@pencel/utils";
import {
  type ClassDeclaration,
  factory,
  getDecorators,
  isCallExpression,
  isDecorator,
  isIdentifier,
  SyntaxKind,
} from "typescript";
import { recordToObjectLiteral } from "../../ts-utils/recordToObjectLiteral.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { inject } from "../core/container.ts";
import { ComponentIR } from "../ir/component.ts";
import type { IRRef } from "../ir/irri.ts";
import { PropertyTransformer } from "./props.ts";
import { RenderTransformer } from "./render.ts";
import { Transformer } from "./transformer.ts";

const warn = createWarn("ComponentTransformer");

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
        recordToObjectLiteral(
          {
            tag: irr.ir.normalizedTag,
            extends: irr.ir.extends,
            [INTERNALS]: {
              styles: irr.ir.processedStyles,
              styleUrls: irr.ir.processedStyleUrls,
            },
          } satisfies ComponentOptions,
          { symbolNames: new Map([[INTERNALS, "INTERNALS"]]) },
        ),
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

      // Add #cmc field if it doesn't already exist
      if (!this.#hasCmcField(updatedMembers)) {
        const cmcField = factory.createPropertyDeclaration(
          undefined,
          factory.createIdentifier("#cmc"),
          undefined,
          undefined,
          factory.createCallExpression(
            factory.createIdentifier("mc"),
            undefined,
            [],
          ),
        );
        updatedMembers = factory.createNodeArray([cmcField, ...updatedMembers]);
      }
    }

    // Combine modifiers (excluding decorators) and updated decorators
    const nonDecoratorModifiers = (irr.node.modifiers ?? []).filter(
      (modifier) => !isDecorator(modifier),
    );

    // Ensure component class has export keyword
    const hasExport = nonDecoratorModifiers.some(
      (m) => m.kind === SyntaxKind.ExportKeyword,
    );

    if (!hasExport) {
      warn(
        `Component class '${irr.ir.className}' in file '${irr.node.getSourceFile().fileName}' is not exported. Adding 'export' keyword. ` +
          `Make sure to export your component classes in the future.`,
      );
    }

    const modifiersWithExport = hasExport
      ? nonDecoratorModifiers
      : [
          factory.createToken(SyntaxKind.ExportKeyword),
          ...nonDecoratorModifiers,
        ];

    const combinedModifiers = [
      ...(updatedDecorators ?? []),
      ...modifiersWithExport,
    ];

    return factory.createClassDeclaration(
      combinedModifiers,
      irr.node.name,
      irr.node.typeParameters,
      irr.node.heritageClauses,
      updatedMembers,
    );
  }

  #hasCmcField(members: ReturnType<typeof factory.createNodeArray>): boolean {
    return members.some((member) => {
      const memberWithName = member as { name?: { text?: string } | string };
      const name = memberWithName.name;
      if (typeof name === "string") {
        return name === "#cmc";
      }
      return name?.text === "#cmc";
    });
  }
}
