import { componentCtrl } from "../controllers/component.ts";

/**
 * Property decorator that makes component state reactive.
 * Changes to state properties will automatically trigger re-renders.
 *
 * @example
 * ```typescript
 * class MyComponent extends HTMLElement {
 *   @State() counter = 0;
 *
 *   increment() {
 *     this.counter++; // This will trigger a re-render
 *   }
 * }
 * ```
 */
export function State(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    // Define getter/setter for the state property
    Object.defineProperty(target, propertyKey, {
      get() {
        return componentCtrl().getState(this, propertyKey);
      },

      set(value: unknown) {
        componentCtrl().setState(this, propertyKey, value);
      },

      enumerable: true,
      configurable: true,
    });
  };
}
