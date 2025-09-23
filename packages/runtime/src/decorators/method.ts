import { ConsumerError } from "@pencel/utils";

/**
 * This Decorator exists for backward compatibility.
 * It provides a warning when accessed and prevents overriding of the decorated property.
 *
 * Property decorator for exposing methods on the custom element instance.
 * Note: This decorator is no longer necessary as all non-private elements are accessible by default.
 *
 * @example
 * ```typescript
 * class MyComponent extends HTMLElement {
 *   @Method()
 *   someMethod() {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export function Method(): PropertyDecorator {
  return (target, propertyKey) => {
    // Define getter/setter for the state property
    Object.defineProperty(target, propertyKey, {
      get() {
        console.warn(
          "[Pencel] Accessing @Method property is no longer necessary. All non-private elements are accessible by nature.",
        );
        return this[propertyKey];
      },

      set() {
        throw new ConsumerError("You cannot override the @Method property.");
      },

      enumerable: true,
      configurable: true,
    });
  };
}
