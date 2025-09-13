import {
  createLog,
  createPerformanceTree,
  throwConsumerError,
} from "@pencil/utils";
import {
  componentCtrl,
  PENCIL_COMPONENT_CONTEXT,
  PENCIL_OBSERVED_ATTRIBUTES,
} from "./controllers/component.ts";
import type {
  ComponentInterfaceWithContext,
  ConstructablePencilComponent,
} from "./core/types.ts";
import type { ComponentOptions } from "./decorators/component.ts";
import {
  coerceAttributeValue,
  reflectAttributeValue,
  resolveAttribute,
  resolveAttributeName,
} from "./utils/attributes.ts";
import { simpleCustomElementDisplayText } from "./utils/simpleCustomElementDisplayText.ts";

const log = createLog("PencilCustomElementWrap");

/**
 * TODO: non-shadow styles (scoped or global) must be attached globally, once per registered component; NOT per instance
 */
function buildStyles(
  component: ComponentInterfaceWithContext,
  options: ComponentOptions,
) {
  const styles = new Set<CSSStyleSheet>();

  const raws = options.styles
    ? Array.isArray(options.styles)
      ? options.styles
      : [options.styles]
    : [];

  raws.forEach((style) => {
    const sheet = new CSSStyleSheet();
    try {
      sheet.replaceSync(style);
      styles.add(sheet);
    } catch (e) {
      console.warn(
        `Could not parse CSS string for ${simpleCustomElementDisplayText(
          component,
        )}:`,
        e,
      );
    }
  });

  return Array.from(styles);
}

function mergeStyleSheetsToStyleTag(sheets: CSSStyleSheet[]): HTMLStyleElement {
  const style = document.createElement("style");

  for (const sheet of sheets) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        style.appendChild(document.createTextNode(rule.cssText));
      }
    } catch (e) {
      console.warn("Could not read CSSStyleSheet:", e);
    }
  }

  return style;
}

function interopStyleAttachment(
  component: ComponentInterfaceWithContext,
  styles: CSSStyleSheet[],
  options: ComponentOptions,
) {
  if (options.shadow) {
    component.shadowRoot!.adoptedStyleSheets = styles;
  } else {
    if (!styles.length) {
      return;
    }

    const stylesElm = mergeStyleSheetsToStyleTag(styles);

    if (options.scoped) {
      throwConsumerError("Scoped styles are not implemented yet");
    } else {
      component.insertBefore(stylesElm, component.firstChild);
    }
  }
}

/**
 * Captures original children for VNode projection in non-shadow components.
 * This enables slot projection by preserving the original DOM content before rendering.
 *
 * TODO: Still hacky
 */
function captureForVNodeProjection(
  component: ComponentInterfaceWithContext,
  options: ComponentOptions,
): void {
  if (!options.shadow && component.childNodes.length > 0) {
    // Store original slot content before any rendering happens
    (
      component as HTMLElement & { __pencil_slot_content__?: Node[] }
    ).__pencil_slot_content__ = Array.from(component.childNodes);
  }
}

let cid = 0;

/**
 * Wraps the component class to register instances with the component controller
 */
export function wrapComponentForRegistration<
  T extends ConstructablePencilComponent,
>(klass: T, options: ComponentOptions, customElementExtends?: string): T {
  return class PencilCustomElementWrap extends klass {
    #bootTracker = createPerformanceTree();

    constructor(...args: any[]) {
      super(...args);
      componentCtrl().announceInstance(this, customElementExtends);
    }

    // Get observed attributes from the prop map
    static get observedAttributes() {
      return PencilCustomElementWrap[PENCIL_OBSERVED_ATTRIBUTES];
    }

    override async connectedCallback() {
      this.setAttribute(`p.cid.${++cid}`, "");

      this.#bootTracker.start("boot");
      log(`👁️ ${simpleCustomElementDisplayText(this)}`);

      // Capture original children for VNode projection (slot support)
      captureForVNodeProjection(this, options);

      if (options.shadow) {
        this.attachShadow({ mode: "open" });
      }

      const styles = buildStyles(this, options);
      interopStyleAttachment(this, styles, options);

      const ctrl = componentCtrl();
      const ctx = this[PENCIL_COMPONENT_CONTEXT];
      const popts = ctx?.popts ?? [];

      for (const [propName, propOptions] of popts) {
        ctrl.setProp(
          this,
          propName,
          resolveAttribute(this, propName, propOptions),
        );
      }

      // Call original connectedCallback if it exists
      await super.connectedCallback?.();
      await super.componentWillLoad?.();

      ctrl.doStabilized(this);
    }

    override componentDidLoad(): void {
      this.setAttribute("p.hydrated", "");
      this.#bootTracker.end("boot");
      this.#bootTracker.log();
      log(`🚀 ${simpleCustomElementDisplayText(this)} hydrated`);
      super.componentDidLoad?.();
    }

    override componentShouldUpdate<TValue>(
      newValue: TValue,
      oldValue: TValue | undefined,
      propName: string | symbol,
    ): boolean {
      return (
        super.componentShouldUpdate?.(newValue, oldValue, propName) ?? true
      );
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      const ctx = this[PENCIL_COMPONENT_CONTEXT];
      const props = ctx?.props ?? [];

      // TODO: This is O(n) on number of props; we could optimize this with a reverse map if needed
      for (const [propName] of props) {
        const propOptions = ctx?.popts.get(propName);
        const attrName = resolveAttributeName(propName, propOptions);

        if (attrName === name) {
          const ctrl = componentCtrl();

          ctrl.setProp(
            this,
            propName,
            coerceAttributeValue(newValue, propOptions, Boolean(newValue)),
          );
          break;
        }
      }

      // Call original attributeChangedCallback if it exists
      super.attributeChangedCallback?.(name, oldValue, newValue);
    }

    override disconnectedCallback(): void {
      componentCtrl().disconnectComponent(this);
    }

    override componentWillRender(): void | Promise<void> {
      const ctx = this[PENCIL_COMPONENT_CONTEXT]!;
      const popts = ctx?.popts ?? [];

      popts.forEach((propOptions, propName) => {
        if (propOptions?.reflect !== true) {
          return;
        }

        const attrName = resolveAttributeName(
          propName,
          ctx.popts.get(propName),
        );

        reflectAttributeValue(
          this,
          attrName,
          ctx.props.get(propName),
          propOptions,
        );
      });

      return super.componentWillRender?.();
    }

    override render() {
      try {
        return super.render?.() ?? null;
      } catch (origin) {
        throwConsumerError(
          `A error occoured while trying to render ${simpleCustomElementDisplayText(this)}`,
          origin,
        );
      }
    }
  } as T;
}
