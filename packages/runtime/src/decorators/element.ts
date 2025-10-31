const GOT_WARNED = Symbol("_$pen_got_warned");

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
  return (target, propertyKey) => {
    // Define getter/setter for the state property
    Object.defineProperty(target, propertyKey, {
      get() {
        if (!this[GOT_WARNED]) {
          this[GOT_WARNED] = true;
          console.warn(
            "[Pencel] Accessing @Element property is no longer necessary. You can directly use 'this' to refer to the element in the DOM.",
          );
        }
        return this;
      },

      set() {
        throw new Error("You cannot override the @Element property.");
      },

      enumerable: true,
      configurable: true,
    });
  };
}
