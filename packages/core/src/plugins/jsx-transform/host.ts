/**
 * Host JSX component plugin - transforms <Host> elements to apply attributes to 'this'.
 */

import { type Expression, factory, type JsxElement, SyntaxKind } from "typescript";
import { PencelPlugin, Plugins } from "../../compiler/core/plugin.ts";
import type { JsxTransformHook } from "../../compiler/types/plugins.ts";
import { createCallWithThis, createExprStmt } from "../../ts-utils/factory-helpers.ts";

export interface HostPluginRegistry {
  host: {
    class: HostPlugin;
    options: Record<string, never>;
  };
}

class HostPlugin extends PencelPlugin {
  constructor() {
    super();
    this.handle("jsx:transform", (hook) => {
      // Debug: log when handler is called
      if (hook.tagName === "Host") {
        hook.result = this.#transformHostComponent(hook);
      }
    });
  }

  /**
   * Transform <Host> component - extract children and apply Host attributes to 'this'
   */
  #transformHostComponent(hook: JsxTransformHook): Expression {
    const jsx = hook.jsxNode as JsxElement;
    const openingElement = (
      jsx as unknown as {
        openingElement: {
          tagName: { text: string };
          attributes: { properties?: unknown };
        };
      }
    ).openingElement;

    // Collect Host attributes to apply to 'this'
    const attributeProperties: ReturnType<typeof factory.createPropertyAssignment>[] = [];
    const hostAttributes = openingElement.attributes.properties;

    if (hostAttributes && Array.isArray(hostAttributes)) {
      for (const attr of hostAttributes) {
        if (attr.kind === SyntaxKind.JsxAttribute && (attr as { name?: { text: string } }).name) {
          const attrName = (attr as { name: { text: string } }).name.text;
          const initializer = (
            attr as {
              initializer?: { kind: SyntaxKind; expression?: Expression };
            }
          ).initializer;

          // Handle event attributes (onMouseEnter, etc.)
          if (attrName.startsWith("on")) {
            const eventName = attrName.slice(2).toLowerCase();
            if (initializer?.kind === SyntaxKind.JsxExpression && initializer.expression) {
              hook.prependStatements.push(
                createExprStmt(
                  createCallWithThis("ael", [factory.createStringLiteral(eventName), initializer.expression]),
                ),
              );
            }
          } else {
            // Regular attributes (class, etc.)
            if (initializer?.kind === SyntaxKind.JsxExpression && initializer.expression) {
              attributeProperties.push(
                factory.createPropertyAssignment(factory.createStringLiteral(attrName), initializer.expression),
              );
            }
          }
        }
      }
    }

    // Create sp.call(this, {...attributes}) call if there are attributes
    if (attributeProperties.length > 0) {
      hook.prependStatements.push(
        createExprStmt(createCallWithThis("sp", [factory.createObjectLiteralExpression(attributeProperties)])),
      );
    }

    // Collect and transform children
    const children = (jsx as unknown as { children?: Array<{ kind: SyntaxKind }> }).children;

    const transformedChildren: Expression[] = [];
    if (children && children.length > 0) {
      for (const child of children) {
        if (child.kind === SyntaxKind.JsxElement || child.kind === SyntaxKind.JsxSelfClosingElement) {
          transformedChildren.push(hook.transformExpression(child as unknown as Expression));
        } else if (child.kind === SyntaxKind.JsxExpression) {
          const expr = (child as unknown as { expression?: Expression }).expression;
          if (expr) {
            transformedChildren.push(hook.transformExpression(expr));
          }
        } else if (child.kind !== SyntaxKind.JsxText) {
          // Include other non-text children as-is
          transformedChildren.push(hook.transformExpression(child as unknown as Expression));
        }
      }
    }

    // Create sc.call(this, [...children]) call and prepend it
    hook.prependStatements.push(
      createExprStmt(createCallWithThis("sc", [factory.createArrayLiteralExpression(transformedChildren)])),
    );

    // Return void(0) - Host doesn't render anything itself
    return factory.createVoidZero();
  }
}

Plugins.register("host", HostPlugin, {});
