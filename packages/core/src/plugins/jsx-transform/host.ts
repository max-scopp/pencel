/**
 * Host JSX component plugin - transforms <Host> elements to apply attributes to 'this'.
 */

import {
  type Expression,
  factory,
  type JsxElement,
  SyntaxKind,
} from "typescript";
import { PencelPlugin, Plugins } from "../../compiler/core/plugin.ts";
import type { JsxTransformHook } from "../../compiler/types/plugins.ts";
import { createCall, createExprStmt } from "../../ts-utils/factory-helpers.ts";

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

    // Get Host attributes to apply to 'this'
    const hostAttributes = openingElement.attributes.properties;
    if (hostAttributes && Array.isArray(hostAttributes)) {
      for (const attr of hostAttributes) {
        if (
          attr.kind === SyntaxKind.JsxAttribute &&
          (attr as { name?: { text: string } }).name
        ) {
          const attrName = (attr as { name: { text: string } }).name.text;
          const initializer = (
            attr as {
              initializer?: { kind: SyntaxKind; expression?: Expression };
            }
          ).initializer;

          // Handle event attributes (onMouseEnter, etc.)
          if (attrName.startsWith("on")) {
            const eventName = attrName.slice(2).toLowerCase();
            if (
              initializer?.kind === SyntaxKind.JsxExpression &&
              initializer.expression
            ) {
              hook.prependStatements.push(
                createExprStmt(
                  createCall(factory.createIdentifier("ael"), [
                    factory.createThis(),
                    factory.createStringLiteral(eventName),
                    initializer.expression,
                  ]),
                ),
              );
            }
          } else {
            // Regular attributes (class, etc.)
            if (
              initializer?.kind === SyntaxKind.JsxExpression &&
              initializer.expression
            ) {
              hook.prependStatements.push(
                createExprStmt(
                  createCall(factory.createIdentifier("sp"), [
                    factory.createThis(),
                    factory.createObjectLiteralExpression([
                      factory.createPropertyAssignment(
                        factory.createStringLiteral(attrName),
                        initializer.expression,
                      ),
                    ]),
                  ]),
                ),
              );
            }
          }
        }
      }
    }

    // Transform children and return the first child directly
    const children = (
      jsx as unknown as { children?: Array<{ kind: SyntaxKind }> }
    ).children;
    if (children && children.length > 0) {
      // Find the first non-whitespace child
      for (const child of children) {
        if (
          child.kind === SyntaxKind.JsxElement ||
          child.kind === SyntaxKind.JsxSelfClosingElement
        ) {
          return hook.transformExpression(child as unknown as Expression);
        }
        if (child.kind === SyntaxKind.JsxExpression) {
          const expr = (child as unknown as { expression?: Expression })
            .expression;
          if (expr) {
            return hook.transformExpression(expr);
          }
        }
      }
    }

    // If no children, return null
    return factory.createNull();
  }
}

Plugins.register("host", HostPlugin, {});
