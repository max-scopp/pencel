import { createLog } from "@pencel/utils";
import { PENCIL_COMPONENT_CONTEXT } from "../core/symbols.ts";
import { deepEqual } from "../utils/equal.ts";

const log = createLog("State");

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
  return (target, propertyKey) => {
    // Define getter/setter for the state property
    Object.defineProperty(target, propertyKey, {
      get() {
        const ctx = this[PENCIL_COMPONENT_CONTEXT];
        return ctx?.state.get(propertyKey);
      },

      set(value: unknown) {
        const ctx = this[PENCIL_COMPONENT_CONTEXT];
        const oldValue = ctx?.state.get(propertyKey);

        const equalFn = options?.equal ?? deepEqual;
        const isEqual = equalFn(value, oldValue);

        if (!isEqual) {
          ctx?.state.set(propertyKey, value);
          log(`${String(propertyKey)}: ${oldValue} → ${value}`);

          const shouldUpdate = this.componentShouldUpdate?.(
            value,
            oldValue,
            propertyKey,
          );

          if (shouldUpdate !== false) {
            this.render?.();
          }
        }
      },

      enumerable: true,
      configurable: true,
    });
  };
}
