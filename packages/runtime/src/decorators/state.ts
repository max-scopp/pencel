import { deepEqual } from "src/utils/equal.ts";
import { componentCtrl } from "../controllers/component.ts";

export interface StateOptions {
  /**
   * Smiliar to `shouldComponentUpdate`, but for this specific state property.
   *
   * This function is called whenever the setter of this state property is invoked.
   */
  equal?: (a: unknown, b: unknown) => boolean;
}

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
export function State(options?: StateOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    // Define getter/setter for the state property
    Object.defineProperty(target, propertyKey, {
      get() {
        return componentCtrl().getState(this, propertyKey);
      },

      set(value: unknown) {
        const ctrl = componentCtrl();

        const equalFn = options?.equal ?? deepEqual;

        const isEqual = equalFn(value, ctrl.getState(this, propertyKey));

        if (!isEqual) {
          ctrl.setState(this, propertyKey, value);
        }
      },

      enumerable: true,
      configurable: true,
    });
  };
}
