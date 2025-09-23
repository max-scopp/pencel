import {
  ConsumerError,
  createPerformanceTree,
  error,
  throwError,
} from "@pencel/utils";
import {
  componentCtrl,
  PENCIL_COMPONENT_CONTEXT,
  PENCIL_OBSERVED_ATTRIBUTES,
} from "./controllers/component.ts";
import type { JSXElement } from "./core/jsx/jsx.ts";
import {
  ATTR_MAP,
  type ComponentInterfaceWithContext,
  type ConstructablePencilComponent,
  PROP_NAMES,
} from "./core/types.ts";
import type { ComponentOptions } from "./decorators/component.ts";
import {
  coerceAttributeValue,
  reflectAttributeValue,
  resolveAttribute,
  resolveAttributeName,
} from "./utils/attributes.ts";
import { simpleCustomElementDisplayText } from "./utils/simpleCustomElementDisplayText.ts";

/**
 * TODO: non-shadow styles (scoped or global) must be attached globally, once per registered component; NOT per instance
 */
function buildStyles(
  component: ComponentInterfaceWithContext,
  options: ComponentOptions,
): CSSStyleSheet[] {
  const styles = new Set<CSSStyleSheet>();

  const raws = options.styles
    ? Array.isArray(options.styles)
      ? options.styles
      : [options.styles]
    : [];

  for (const i in raws) {
    if (Object.hasOwn(raws, i)) {
      const style = raws[i];
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
    }
  }

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
  if (options.shadow && component.shadowRoot) {
    component.shadowRoot.adoptedStyleSheets = styles;
  } else {
    if (styles.length === 0) {
      return;
    }

    const stylesElm = mergeStyleSheetsToStyleTag(styles);

    if (options.scoped) {
      throw new ConsumerError("Scoped styles are not implemented yet");
    }
    component.insertBefore(stylesElm, component.firstChild);
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
    #hydratePerf = createPerformanceTree("Hydration");

    // biome-ignore lint/suspicious/noExplicitAny: must be any for super()
    constructor(...args: any[]) {
      super(...args);
      componentCtrl().connect(this, customElementExtends);
    }

    // Get observed attributes from the prop map
    static get observedAttributes(): string[] {
      return PencilCustomElementWrap[PENCIL_OBSERVED_ATTRIBUTES];
    }

    override async connectedCallback(): Promise<void> {
      this.#hydratePerf.start("hydrate");

      // Setup phase
      this.setAttribute(`p.cid.${++cid}`, "");

      // Shadow DOM initialization if needed
      if (options.shadow) {
        this.attachShadow({ mode: "open" });
      }

      // Props initialization
      this.#hydratePerf.start("props");
      initializeProps(this);
      this.#hydratePerf.end("props");

      // Styles initialization
      this.#hydratePerf.start("styles");
      initializeStyles(this, options);
      this.#hydratePerf.end("styles");

      // Content projection setup
      this.#hydratePerf.start("slots");
      captureForVNodeProjection(this, options);
      this.#hydratePerf.end("slots");

      // Lifecycle methods
      this.#hydratePerf.start("lifecycle");
      await super.connectedCallback?.();
      await super.componentWillLoad?.();
      this.#hydratePerf.end("lifecycle");

      componentCtrl().markStableAndLoaded(this);
      this.#hydratePerf.end("hydrate");
    }

    override componentDidLoad(): void {
      this.setAttribute("p.hydrated", "");
      this.#hydratePerf.log();
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
      updatePropsByAttribute(this, name, newValue);
      super.attributeChangedCallback?.(name, oldValue, newValue);
    }

    override disconnectedCallback(): void {
      componentCtrl().disconnect(this);
      super.disconnectedCallback?.();
    }

    override componentWillRender(): void | Promise<void> {
      const ctx = this[PENCIL_COMPONENT_CONTEXT];
      const popts = ctx?.popts ?? [];

      if (!ctx) {
        throw new ConsumerError(
          `Missing component context on ${simpleCustomElementDisplayText(this)}. Did you forget to call super() in the constructor?`,
        );
      }

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

    override render(): JSXElement {
      try {
        return super.render?.() ?? null;
      } catch (origin) {
        error(origin);
        throw new ConsumerError(
          `A error occoured while trying to render ${simpleCustomElementDisplayText(this)}`,
        );
      }
    }
  } as T;
}

/**
 * Registers props as attributes for the custom elements API and initializes prop metadata
 */
export function initializeProps(
  component: ComponentInterfaceWithContext,
): void {
  const ctrl = componentCtrl();
  const props = component[PROP_NAMES];

  props?.forEach((propOptions, propName) => {
    const attrName = resolveAttributeName(propName, propOptions);

    // declare this prop as attr on the base class statically for `observedAttributes`
    const cnstrctr = component.constructor as ConstructablePencilComponent;
    cnstrctr[PENCIL_OBSERVED_ATTRIBUTES] ??= [];
    cnstrctr[PENCIL_OBSERVED_ATTRIBUTES].push(attrName);

    // TODO: This may be deleted
    component[PENCIL_COMPONENT_CONTEXT]?.popts.set(propName, propOptions);
    component[PENCIL_COMPONENT_CONTEXT]?.props.set(propName, undefined);

    ctrl.setProp(
      component,
      propName,
      resolveAttribute(component, propName, propOptions),
    );
  });
}

/**
 * Initializes and attaches styles to the component instance
 */
export function initializeStyles(
  component: ComponentInterfaceWithContext,
  options: ComponentOptions,
): void {
  const styles = buildStyles(component, options);
  interopStyleAttachment(component, styles, options);
}

export function updatePropsByAttribute(
  component: ComponentInterfaceWithContext,
  attrName: string,
  newValue: string | null,
): void {
  const ctrl = componentCtrl();
  const propName = component[ATTR_MAP]?.get(attrName);

  if (!propName) {
    throwError(
      `Attribute "${attrName}" is not mapped to any property on ${simpleCustomElementDisplayText(component)}.`,
    );
  }

  const propOptions = component[PROP_NAMES]?.get(propName);
  const propValue = coerceAttributeValue(
    newValue,
    propOptions,
    Boolean(newValue),
  );

  ctrl.setProp(component, propName, propValue);
}
