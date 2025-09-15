import { throwConsumerError } from "@pencel/utils";

/**
 * This Decorator exists for backward compatibility.
 * In Pencel, `this` already refers to the element in the DOM.
 *
 * Property decorator for exposing the host custom element instance.
 * Use `@Element()` to access the underlying HTMLElement within your component.
 *
 * @example
 * ```typescript
 * class MyComponent extends HTMLElement {
 *   @Element() el: HTMLElement;
 *
 *   connectedCallback() {
 *     this.el.classList.add('hydrated');
 *   }
 * }
 * ```
 */
export function Element(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    // Define getter/setter for the state property
    Object.defineProperty(target, propertyKey, {
      get() {
        console.warn(
          "[Pencel] Accessing @Element property is no longer necessary. You can directly use 'this' to refer to the element in the DOM.",
        );
        return target;
      },

      set() {
        throwConsumerError("You cannot override the @Element property.");
      },

      enumerable: true,
      configurable: true,
    });
  };
}
