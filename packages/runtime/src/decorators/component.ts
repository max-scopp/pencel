import { getExtendsByInheritance } from "@pencil/utils";
import { pencilConfig } from "src/config.ts";
import { scheduleComponentUpdate } from "../core/render.ts";
import type { PropOptions } from "./prop.ts";

// Reactive system for components
export const reactiveComponents = new WeakMap<HTMLElement, ReactiveComponent>();

interface ReactiveComponent {
  render: () => void;
  props: Map<string, unknown>;
  state: Map<string, unknown>;
}

export interface ComponentOptions {
  tagName?: string;
}

export function triggerUpdate(component: HTMLElement) {
  const reactive = reactiveComponents.get(component);
  if (reactive) {
    scheduleComponentUpdate(component, reactive.render);
  }
}

export const $extendsByInheritance = Symbol("extendsByInheritance");

export const Component = (_options: ComponentOptions): ClassDecorator => {
  // biome-ignore lint/suspicious/noExplicitAny: ClassDecorator requires generic function type
  return (klass: any) => {
    if (typeof customElements === "undefined") {
      console.log(
        "Skipping customElements.define: not supported in this environment",
      );
      return klass;
    }

    const tagName = [pencilConfig.tagNamespace, _options.tagName]
      .filter(Boolean)
      .join("-");

    const extendsByInheritance = getExtendsByInheritance(klass);

    Object.defineProperty(klass, $extendsByInheritance, {
      get() {
        return extendsByInheritance;
      },
    });

    console.log("Registering:", tagName, "extends:", extendsByInheritance);

    // Add observedAttributes getter to monitor attribute changes
    Object.defineProperty(klass, "observedAttributes", {
      get() {
        const props = (this as { __pencilProps?: Map<string, PropOptions> })
          .__pencilProps;
        if (!props) return [];
        return Array.from(props.keys());
      },
      enumerable: true,
      configurable: true,
    });

    // Add attributeChangedCallback to handle prop changes from attributes
    const originalAttributeChangedCallback =
      klass.prototype.attributeChangedCallback;
    klass.prototype.attributeChangedCallback = function (
      name: string,
      oldValue: string,
      newValue: string,
    ) {
      // Call original callback if it exists
      if (originalAttributeChangedCallback) {
        originalAttributeChangedCallback.call(this, name, oldValue, newValue);
      }

      // Handle prop updates from attributes
      const propOptions = (
        this.constructor as { __pencilProps?: Map<string, PropOptions> }
      ).__pencilProps?.get(name);
      if (propOptions) {
        let convertedValue: unknown = newValue;

        // Type conversion based on prop options
        if (propOptions.type) {
          convertedValue = propOptions.type(newValue);
        }

        // Set the prop value (this will trigger the setter)
        (this as Record<string, unknown>)[name] = convertedValue;
      }
    };

    // Add connectedCallback to initialize props from attributes
    const originalConnectedCallback = klass.prototype.connectedCallback;
    klass.prototype.connectedCallback = function () {
      // Initialize props from attributes
      const propMap = (
        this.constructor as { __pencilProps?: Map<string, PropOptions> }
      ).__pencilProps;
      if (propMap) {
        for (const [propName, propOptions] of propMap) {
          if (this.hasAttribute(propName)) {
            const attrValue = this.getAttribute(propName);
            let convertedValue: unknown = attrValue;

            // Type conversion based on prop options
            if (propOptions.type) {
              switch (propOptions.type) {
                case Number:
                  convertedValue =
                    attrValue === null ? null : Number(attrValue);
                  break;
                case Boolean:
                  convertedValue = attrValue !== null;
                  break;
                case Date:
                  convertedValue =
                    attrValue === null ? null : new Date(attrValue);
                  break;
                case String:
                default:
                  convertedValue = attrValue;
                  break;
              }
            }

            // Set the prop value (this will trigger the setter)
            (this as Record<string, unknown>)[propName] = convertedValue;
          }
        }
      }

      // Call original connectedCallback if it exists
      if (originalConnectedCallback) {
        originalConnectedCallback.call(this);
      }
    };

    if (extendsByInheritance) {
      // Customized built-in element
      // biome-ignore lint/suspicious/noExplicitAny: CustomElementConstructor type assertion required
      customElements.define(tagName, klass as any, {
        extends: extendsByInheritance,
      });
    } else {
      // Autonomous custom element
      // biome-ignore lint/suspicious/noExplicitAny: CustomElementConstructor type assertion required
      customElements.define(tagName, klass as any);
    }
  };
};
