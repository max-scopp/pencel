import { createLog, createPerformanceTree, error } from "@pencel/utils";
import type { ComponentOptions } from "../decorators/component.ts";
import {
  coerceAttributeValue,
  reflectAttributeValue,
  resolveAttribute,
  resolveAttributeName,
} from "../utils/attributes.ts";
import { simpleCustomElementDisplayText } from "../utils/simpleCustomElementDisplayText.ts";
import {
  PENCIL_COMPONENT_CONTEXT,
  PENCIL_OBSERVED_ATTRIBUTES,
} from "./symbols.ts";
import {
  ATTR_MAP,
  type ComponentInterfaceWithContext,
  type ConstructablePencilComponent,
  PROP_NAMES,
} from "./types.ts";

const log = createLog("Wrapper");

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
      throw new Error("Scoped styles are not implemented yet");
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
  /**
   * Copy property descriptors (getters/setters) from a source prototype chain
   * to a target object. This ensures @State/@Prop/@Store descriptors are
   * accessible without the wrapper being in between.
   */
  const copyAccessorDescriptors = (target: object, source: object): void => {
    let proto = source;
    while (proto && proto !== Object.prototype) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === "constructor") continue;

        const descriptor = Object.getOwnPropertyDescriptor(proto, key);
        if (descriptor && (descriptor.get || descriptor.set)) {
          Object.defineProperty(target, key, {
            get: descriptor.get,
            set: descriptor.set,
            enumerable: descriptor.enumerable,
            configurable: descriptor.configurable,
          });
        }
      }
      proto = Object.getPrototypeOf(proto);
    }
  };

  class PencilCustomElementWrap extends klass {
    #hydratePerf = createPerformanceTree("Hydration");
    #renderPerf = createPerformanceTree("Render");
    #renderFrameId: number | null = null;
    #pendingRender = false;

    // biome-ignore lint/suspicious/noExplicitAny: must be any for super()
    constructor(...args: any[]) {
      super(...args);

      // Initialize component context
      this[PENCIL_COMPONENT_CONTEXT] = {
        extends: customElementExtends,
        props: new Map(),
        popts: new Map(),
        state: new Map(),
        stores: new Map(),
      };

      // Capture initial values from class fields before copying descriptors
      let proto = klass.prototype;
      while (proto && proto !== Object.prototype) {
        for (const key of Object.getOwnPropertyNames(proto)) {
          if (key === "constructor") continue;

          const descriptor = Object.getOwnPropertyDescriptor(proto, key);
          // If it's a state/prop descriptor and we have an own property with a value,
          // initialize it in the context
          if (descriptor && (descriptor.get || descriptor.set)) {
            const ownDescriptor = Object.getOwnPropertyDescriptor(this, key);
            if (
              ownDescriptor &&
              ownDescriptor.value !== undefined &&
              !this[PENCIL_COMPONENT_CONTEXT]?.state.has(key)
            ) {
              this[PENCIL_COMPONENT_CONTEXT]?.state.set(
                key,
                ownDescriptor.value,
              );
              // Delete the own property so descriptor is used instead
              // biome-ignore lint/suspicious/noExplicitAny: property deletion required
              delete (this as any)[key];
            }
          }
        }
        proto = Object.getPrototypeOf(proto);
      }

      // Copy property descriptors to this instance
      copyAccessorDescriptors(this, klass.prototype);
    }

    // Get observed attributes from the prop map
    static get observedAttributes(): string[] {
      return PencilCustomElementWrap[PENCIL_OBSERVED_ATTRIBUTES];
    }

    override async connectedCallback(): Promise<void> {
      this.#hydratePerf.start("hydrate");
      log(`connectedCallback: ${simpleCustomElementDisplayText(this)}`);

      // Setup phase
      this.setAttribute(`p.cid.${++cid}`, "");

      // Shadow DOM initialization if needed
      if (options.shadow) {
        this.attachShadow({ mode: "open" });
        log("  shadow DOM attached");
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
      await this.componentWillLoad?.();

      // Initial render
      await this.componentWillRender?.();
      this.render();
      this.componentDidLoad?.();
      this.componentDidRender?.();
      this.#hydratePerf.end("lifecycle");

      this.setAttribute("hydrated", "");

      this.#hydratePerf.end("hydrate");
      this.#hydratePerf.log();
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      log(`attributeChanged ${name}: ${oldValue} → ${newValue}`);
      updatePropsByAttribute(this, name, newValue);
      super.attributeChangedCallback?.(name, oldValue, newValue);
    }

    override componentShouldUpdate<TValue>(
      newValue: TValue,
      oldValue: TValue | undefined,
      propName: string | symbol,
    ): boolean {
      const shouldUpdate = super.componentShouldUpdate?.(
        newValue,
        oldValue,
        propName,
      );

      if (shouldUpdate === false) {
        log(`  componentShouldUpdate returned false for ${String(propName)}`);
      }

      return shouldUpdate ?? true;
    }

    override disconnectedCallback(): void {
      log(`disconnectedCallback: ${simpleCustomElementDisplayText(this)}`);
      // Cancel any pending render when component is removed
      if (this.#renderFrameId !== null) {
        cancelAnimationFrame(this.#renderFrameId);
        this.#renderFrameId = null;
        this.#pendingRender = false;
      }
      super.disconnectedCallback?.();
    }

    override componentWillRender(): void | Promise<void> {
      const ctx = this[PENCIL_COMPONENT_CONTEXT];
      const popts = ctx?.popts ?? [];

      if (!ctx) {
        throw new Error(
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

    #scheduleRender(): void {
      // If already scheduled for next frame, don't queue another one
      if (this.#pendingRender) {
        return;
      }

      this.#pendingRender = true;
      this.#renderFrameId = requestAnimationFrame(() => {
        this.#pendingRender = false;
        this.#renderFrameId = null;
        this.#doRender();
      });
    }

    #doRender(): void {
      this.#renderPerf.start("total");
      log(`render: ${simpleCustomElementDisplayText(this)}`);

      try {
        super.render?.();
      } catch (origin) {
        error(origin);
        throw new Error(
          `Error rendering ${simpleCustomElementDisplayText(this)}`,
        );
      } finally {
        this.#renderPerf.end("total");
        this.#renderPerf.log();
      }
    }

    override render(): JSX.Element {
      this.#scheduleRender();
      return undefined as unknown as JSX.Element;
    }
  }

  // Copy property descriptors to the wrapper's prototype
  copyAccessorDescriptors(PencilCustomElementWrap.prototype, klass.prototype);

  return PencilCustomElementWrap as T;
}

/**
 * Registers props as attributes for the custom elements API and initializes prop metadata
 */
export function initializeProps(
  component: ComponentInterfaceWithContext,
): void {
  const props = component[PROP_NAMES];

  props?.forEach((propOptions, propName) => {
    const attrName = resolveAttributeName(propName, propOptions);

    // declare this prop as attr on the base class statically for `observedAttributes`
    const cnstrctr = component.constructor as ConstructablePencilComponent;
    cnstrctr[PENCIL_OBSERVED_ATTRIBUTES] ??= [];
    cnstrctr[PENCIL_OBSERVED_ATTRIBUTES].push(attrName);

    component[PENCIL_COMPONENT_CONTEXT]?.popts.set(propName, propOptions);
    component[PENCIL_COMPONENT_CONTEXT]?.props.set(
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
  const propName = component[ATTR_MAP]?.get(attrName);

  if (!propName) {
    throw new Error(
      `Attribute "${attrName}" is not mapped to any property on ${simpleCustomElementDisplayText(component)}.`,
    );
  }

  const propOptions = component[PROP_NAMES]?.get(propName);
  const propValue = coerceAttributeValue(
    newValue,
    propOptions,
    Boolean(newValue),
  );

  const ctx = component[PENCIL_COMPONENT_CONTEXT];
  const oldValue = ctx?.props.get(propName);
  ctx?.props.set(propName, propValue);

  const shouldUpdate = component.componentShouldUpdate?.(
    propValue,
    oldValue,
    propName,
  );

  if (shouldUpdate !== false) {
    component.render?.();
  }
}
