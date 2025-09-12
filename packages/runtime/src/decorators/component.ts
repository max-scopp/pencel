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

/**
 * Handles type conversion for attribute values based on prop options
 */
function convertAttributeValue(
  value: string | null,
  propOptions: PropOptions,
): unknown {
  if (!propOptions.type) {
    return value;
  }

  if (value === null) {
    return null;
  }

  switch (propOptions.type) {
    case Number:
      return Number(value);
    case Boolean:
      return true; // Presence of attribute means true
    case Date:
      return new Date(value);
    default:
      return value;
  }
}

/**
 * Sets up attribute observation for reactive props
 */
function setupAttributeObservation(klass: CustomElementConstructor) {
  // Add observedAttributes getter to monitor attribute changes
  Object.defineProperty(klass, "observedAttributes", {
    get() {
      const props = (this as { __pencilProps?: Map<string, PropOptions> })
        .__pencilProps;
      return props ? Array.from(props.keys()) : [];
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
      const convertedValue = convertAttributeValue(newValue, propOptions);
      // Set the prop value (this will trigger the setter)
      (this as Record<string, unknown>)[name] = convertedValue;
    }
  };
}

/**
 * Sets up lifecycle callbacks for prop initialization
 */
function setupLifecycleCallbacks(klass: CustomElementConstructor) {
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
          const convertedValue = convertAttributeValue(attrValue, propOptions);
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
}

/**
 * Registers the component with the custom elements registry
 */
function registerComponent(
  klass: CustomElementConstructor,
  tagName: string,
  extendsByInheritance: string | null,
) {
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
  return <TFunction extends Function>(klass: TFunction) => {
    // Skip registration if custom elements aren't supported
    if (typeof customElements === "undefined") {
      console.log(
        "Skipping customElements.define: not supported in this environment",
      );
      return klass;
    }

    const tagName = generateTagName(options);
    const extendsByInheritance = getExtendsByInheritance(klass);

    // Store inheritance info for later use
    Object.defineProperty(klass, $extendsByInheritance, {
      get() {
        return extendsByInheritance;
      },
    });

    console.log("Registering:", tagName, "extends:", extendsByInheritance);

    // Set up reactive attribute observation
    setupAttributeObservation(klass as any);

    // Set up lifecycle callbacks
    setupLifecycleCallbacks(klass as any);

    // Register the component
    registerComponent(klass as any, tagName, extendsByInheritance ?? null);

    return klass;
  };
};
