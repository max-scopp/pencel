import {
  createLog,
  createPerformanceTree,
  throwConsumerError,
} from "@pencil/utils";
import { create } from "domain";
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
import { convertAttributeValue } from "./utils/convertAttributeValue.ts";
import { dashCase } from "./utils/dashCase.ts";
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
 * Wraps the component class to register instances with the component controller
 */
export function wrapComponentForRegistration<
  T extends ConstructablePencilComponent,
>(klass: T, options: ComponentOptions, customElementExtends?: string): T {
  const Wrapper = class PencilCustomElementWrap extends klass {
    #bootTracker = createPerformanceTree();

    constructor(...args: any[]) {
      super(...args);
      componentCtrl().announceInstance(this, customElementExtends);
    }

    // Get observed attributes from the prop map
    static get observedAttributes() {
      return Wrapper[PENCIL_OBSERVED_ATTRIBUTES];
    }

    override async connectedCallback() {
      this.#bootTracker.start("boot");
      log(`👁️ ${simpleCustomElementDisplayText(this)}`);

      if (options.shadow) {
        this.attachShadow({ mode: "open" });
      }

      const styles = buildStyles(this, options);
      interopStyleAttachment(this, styles, options);

      const ctrl = componentCtrl();
      const ctx = this[PENCIL_COMPONENT_CONTEXT];
      const popts = ctx?.popts ?? [];

      for (const [propName, propOptions] of popts) {
        const attrName = propOptions?.attr || dashCase(String(propName));
        const attrValue = this.getAttribute(attrName);
        const hasAttr = this.hasAttribute(attrName);

        const convertedValue = convertAttributeValue(
          attrValue,
          propOptions,
          hasAttr,
        );

        ctrl.setProp(this, propName, convertedValue);
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
      const popts = ctx?.popts ?? [];

      for (const [propName, propOptions] of popts) {
        const attrName = propOptions?.attr || dashCase(propName as string);

        if (attrName === name) {
          const hasAttr = this.hasAttribute(name);
          const convertedValue = convertAttributeValue(
            newValue,
            propOptions,
            hasAttr,
          );

          componentCtrl().setProp(this, propName, convertedValue);
          break;
        }
      }

      // Call original attributeChangedCallback if it exists
      super.attributeChangedCallback?.(name, oldValue, newValue);
    }

    override disconnectedCallback(): void {
      componentCtrl().disconnectComponent(this);
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

  return Wrapper;
}
