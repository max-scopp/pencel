import { createLog, getExtendsByInheritance } from "@pencil/utils";
import { pencilConfig } from "src/config.ts";
import { scheduler } from "src/core/scheduler.ts";
import { componentCtrl } from "../controllers/component.ts";
import type { PropOptions } from "./prop.ts";

// Reactive system for components
export const reactiveComponents: WeakMap<HTMLElement, ReactiveComponent> =
  new WeakMap<HTMLElement, ReactiveComponent>();

interface ReactiveComponent {
  render: () => void;
  props: Map<string, unknown>;
  state: Map<string, unknown>;
}

export interface ComponentOptions {
  tagName?: string;
}

const componentLogger = createLog("Component");

export function triggerUpdate(component: HTMLElement): void {
  const reactive = reactiveComponents.get(component);
  if (reactive) {
    scheduler().scheduleUpdate(reactive.render);
  }
}

export const $extendsByInheritance: unique symbol = Symbol(
  "extendsByInheritance",
);

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
  componentLogger("Adding observedAttributes getter for reactive props");

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

  componentLogger("Adding attributeChangedCallback for prop updates");

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
  componentLogger(
    "Adding connectedCallback for prop initialization from attributes",
  );

  // Add connectedCallback to initialize props from attributes
  const originalConnectedCallback = klass.prototype.connectedCallback;
  klass.prototype.connectedCallback = function () {
    componentLogger("Initializing component props from attributes");

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
  componentLogger(
    `Registering component with tag: ${tagName}; extends: ${extendsByInheritance || "none"}`,
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
 * Wraps the component class to register instances with the component controller
 */
function wrapComponentForRegistration<T extends CustomElementConstructor>(
  klass: T,
): T {
  return class PencilCustomElementWrap extends klass {
    constructor(...args: any[]) {
      super(...args);
      componentCtrl().registerComponent(this as HTMLElement);
    }
  } as T;
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
  return <TUnconstructedClass extends object>(klass: TUnconstructedClass) => {
    componentLogger(
      `Starting component registration for ${options.tagName || "unnamed component"}`,
    );

    // Skip registration if custom elements aren't supported
    if (typeof customElements === "undefined") {
      componentLogger(
        "Skipping customElements.define: not supported in this environment",
        "color: orange",
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

    // Wrap the class to register component instances
    const wrappedKlass = wrapComponentForRegistration(
      klass as unknown as CustomElementConstructor,
    );

    componentLogger(
      `Generated tag name: ${tagName}, extends: ${extendsByInheritance || "none"}`,
    );

    setupAttributeObservation(wrappedKlass);

    setupLifecycleCallbacks(wrappedKlass);

    registerComponent(wrappedKlass, tagName, extendsByInheritance ?? null);

    componentLogger(
      `Component registration completed for ${tagName}`,
      "color: green",
    );

    return wrappedKlass as unknown as TUnconstructedClass;
  };
};
