import {
  createLog,
  getExtendsByInheritance,
  throwConsumerError,
} from "@pencil/utils";
import { pencilConfig } from "src/config.ts";
import type { ConstructablePencilComponent } from "src/core/types.ts";
import { dashCase } from "src/utils/dashCase.ts";
import { simpleCustomElementDisplayText } from "src/utils/simpleCustomElementDisplayText.ts";
import {
  componentCtrl,
  PENCIL_COMPONENT_CONTEXT,
  PENCIL_OBSERVED_ATTRIBUTES,
} from "../controllers/component.ts";
import type { PropOptions } from "./prop.ts";

export interface ComponentOptions {
  tagName?: string;
}

const log = createLog("Component");

/**
 * Handles type conversion for attribute values based on prop options
 */
function convertAttributeValue(
  value: string | null,
  propOptions?: PropOptions,
  hasAttribute = false,
): unknown {
  if (!propOptions?.type) {
    return value;
  }

  if (propOptions.type === Boolean) {
    if (hasAttribute) {
      return true; // presence means true
    }

    return false; // absence means false
  }

  switch (propOptions.type) {
    default:
      return propOptions.type(value);
  }
}

/**
 * Wraps the component class to register instances with the component controller
 */
function wrapComponentForRegistration<T extends ConstructablePencilComponent>(
  klass: T,
  customElementExtends?: string,
): T {
  const Wrapper = class PencilCustomElementWrap extends klass {
    constructor(...args: any[]) {
      super(...args);
      componentCtrl().announceInstance(this, customElementExtends);
    }

    // Get observed attributes from the prop map
    static get observedAttributes() {
      return Wrapper[PENCIL_OBSERVED_ATTRIBUTES];
    }

    override connectedCallback(): void {
      log("init props");

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
      super.connectedCallback?.();
      super.componentWillLoad?.();

      ctrl.doStabilized(this);
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

/**
 * Registers the component with the custom elements registry
 */
function defineCustomElement(
  klass: CustomElementConstructor,
  tagName: string,
  extendsByInheritance?: string,
) {
  log(
    "define",
    undefined,
    tagName + (extendsByInheritance ? ` extends ${extendsByInheritance}` : ""),
  );

  if (extendsByInheritance) {
    // Customized built-in element
    customElements.define(tagName, klass, {
      extends: extendsByInheritance,
    });
  } else {
    // Autonomous custom element
    customElements.define(tagName, klass);
  }
}

/**
 * Generates a tag name for the component
 */
function generateTagName(options: ComponentOptions): string {
  return [pencilConfig.tagNamespace, options.tagName].filter(Boolean).join("-");
}

/**
 * Component decorator that registers a class as a custom element.
 * Handles reactive props, attribute observation, and lifecycle management.
 *
 * @param options Configuration options for the component
 * @returns A class decorator function
 *
 * @example
 * ```typescript
 * @Component({ tagName: "my-button" })
 * class MyButton extends HTMLButtonElement {
 *   @Prop() label = "Click me";
 *
 *   render() {
 *     return <button>{this.label}</button>;
 *   }
 * }
 * ```
 */
export const Component = (options: ComponentOptions): ClassDecorator => {
  return (klass: object) => {
    if (typeof customElements === "undefined") {
      log("skip define - no registry");
      return klass as any;
    }

    const tagName = generateTagName(options);
    const customElementExtends = getExtendsByInheritance(klass);

    const wrappedKlass = wrapComponentForRegistration(
      klass as unknown as ConstructablePencilComponent,
      customElementExtends,
    );

    defineCustomElement(wrappedKlass, tagName, customElementExtends);

    return wrappedKlass as any;
  };
};
