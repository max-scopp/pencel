import { warn } from "node:console";
import { createLog } from "@pencel/utils";
import { type ErrorLocation, transform } from "lightningcss";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";
import { PencelPlugin, Plugins } from "../compiler/core/plugin.ts";

const log = createLog("CSS");

function isErrorLocation(err: unknown): err is SyntaxError & ErrorLocation {
  return (
    typeof err === "object" && err !== null && "line" in err && "column" in err
  );
}

interface CssPluginOptions {
  lightningCssOptions?: {
    minify?: boolean;
  };
  scopedTransform?: boolean;
}

export interface CssPluginRegistry {
  css: {
    class: CssPlugin;
    options: CssPluginOptions;
  };
}

class CssPlugin extends PencelPlugin {
  readonly #options: CssPluginOptions;

  constructor(options: CssPluginOptions) {
    super();
    this.#options = options;

    this.handle("css:postprocess", (hook) => {
      log(`Handle ${hook.path}`);

      try {
        // Apply scoping transformation if component is scoped and feature is enabled
        let cssContent = hook.input;
        const isScopedTransformEnabled =
          this.#options.scopedTransform !== false;
        if (isScopedTransformEnabled && hook.irr?.ir.scoped === true) {
          cssContent = this.applyScopedTransform(
            cssContent,
            hook.irr.ir.normalizedTag,
          );
        }

        const result = transform({
          ...this.#options.lightningCssOptions,
          code: Buffer.from(cssContent),
          filename: hook.path,
        });

        result.warnings.forEach((warning) => {
          warn(`${warning.message}`);
        });

        hook.input = result.code.toString();
      } catch (err) {
        if (isErrorLocation(err)) {
          warn(
            `CSS Syntax Error in ${hook.path}:${err.line}:${err.column}\n\t${err.message}`,
          );
        } else {
          throw err;
        }
      }
    });
  }
  /**
   * Apply scoped CSS transformation for light-DOM components.
   *
   * When scoped: true, this method:
   * 1. Transforms shadow-DOM-only pseudo-selectors (:host, :host(...), :host-context(...))
   *    to light-DOM equivalents
   * 2. Wraps all resulting selectors with the component tag to scope them to the component only
   * 3. Avoids double-prefixing (e.g., doesn't create tagName tagName selectors)
   *
   * @param cssSource - Original CSS text
   * @param tagName - Custom element normalized tag (e.g. "wb-my-component")
   * @returns Transformed CSS with all selectors scoped to the component
   * @throws Errors from postcss parsing or transformation
   */
  private applyScopedTransform(cssSource: string, tagName: string): string {
    const root = postcss.parse(cssSource);

    root.walkRules((rule) => {
      const transformed = selectorParser((selectors) => {
        selectors.each((selector) => {
          // First, transform :host pseudo-selectors
          selector.walkPseudos((pseudo) => {
            if (pseudo.value === ":host") {
              if (pseudo.nodes?.length) {
                // :host(.active) => .active
                const inner = pseudo.nodes.map((n) => n.toString()).join("");
                pseudo.replaceWith(selectorParser.string({ value: inner }));
              } else {
                // plain :host => (remove it, will be prefixed)
                pseudo.remove();
              }
            } else if (pseudo.value === ":host-context") {
              if (pseudo.nodes?.length) {
                // :host-context(.dark) => .dark (as descendant combinator context)
                const inner = pseudo.nodes.map((n) => n.toString()).join("");
                // Replace with the context selector
                pseudo.replaceWith(selectorParser.string({ value: inner }));
              } else {
                pseudo.remove();
              }
            }
          });

          // Check if selector already starts with the tagName (avoid double-prefixing)
          const firstNode = selector.first;
          const startsWithTag =
            firstNode &&
            firstNode.type === "tag" &&
            firstNode.value === tagName;

          // If it doesn't already start with tagName, prepend it with space
          if (!startsWithTag) {
            const newTag = selectorParser.tag({ value: tagName });
            const space = selectorParser.combinator({ value: " " });
            selector.insertBefore(selector.first, space);
            selector.insertBefore(space, newTag);
          }
        });
      }).processSync(rule.selector);

      rule.selector = transformed;
    });

    return root.toString();
  }
}

Plugins.register("css", CssPlugin, {
  lightningCssOptions: {
    minify: true,
  },
  scopedTransform: true,
});
