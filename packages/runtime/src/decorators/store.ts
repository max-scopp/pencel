import { createLog, fromToText } from "@pencel/utils";
import { PENCIL_COMPONENT_CONTEXT } from "../core/symbols.ts";
import { deepEqual } from "../utils/equal.ts";

const log = createLog("Store");

export interface StoreOptions {
  /**
   * Provide a store with this name.
   * If not provided, the property name is used.
   */
  name?: string;

  /**
   * Smiliar to `shouldComponentUpdate`, but for this specific state property.
   *
   * This function is called whenever the setter of this state property is invoked.
   */
  equal?: (a: unknown, b: unknown) => boolean;
}

export interface ConnectOptions {
  /**
   * Connect to a store with this name.
   * If not provided, the property name is used.
   */
  name?: string;
}

/**
 * Decorator to define a property as a "store" within a component.
 *
 * A store behaves similarly to a state property: when its value changes,
 * the component will re-render. However, unlike state, a store can be
 * connected to by other components nested inside the current component
 * using the `@Connected` decorator. This enables sharing and synchronizing
 * state between parent and child components.
 *
 * @param options Optional configuration for the store, such as a custom equality function.
 * @returns A property decorator that manages the store's value and triggers re-renders on change.
 */
export function Store(options?: StoreOptions): PropertyDecorator {
  return (target, propertyKey) => {
    // Define getter/setter for the store property
    Object.defineProperty(target, propertyKey, {
      get() {
        const ctx = this[PENCIL_COMPONENT_CONTEXT];
        if (!ctx?.stores) {
          ctx.stores = new Map();
        }
        return ctx.stores.get(propertyKey);
      },

      set(value: unknown) {
        const ctx = this[PENCIL_COMPONENT_CONTEXT];
        if (!ctx?.stores) {
          ctx.stores = new Map();
        }

        const equalFn = options?.equal ?? deepEqual;
        const oldValue = ctx.stores.get(propertyKey);
        const isEqual = equalFn(value, oldValue);

        if (!isEqual) {
          ctx.stores.set(propertyKey, value);
          log(fromToText(String(propertyKey), oldValue, value));

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

/**
 * Property decorator that connects a component property to a store.
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   @Connected({ name: 'myStore' })
 *   state: MyState;
 * }
 * ```
 */
export function Connected(options?: ConnectOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    // Define getter/setter for the connected store property
    Object.defineProperty(target, propertyKey, {
      get() {
        // biome-ignore lint/suspicious/noExplicitAny: element traversal requires any
        const findStoreInParent = (el: any): unknown => {
          if (!el) return null;

          const storeName = options?.name ?? String(propertyKey);
          const ctx = el[PENCIL_COMPONENT_CONTEXT];

          if (ctx?.stores?.has(storeName)) {
            return ctx.stores.get(storeName);
          }

          // Check parent
          if (el.parentElement) {
            return findStoreInParent(el.parentElement);
          }

          return null;
        };

        return findStoreInParent(this);
      },

      set(value: unknown) {
        // Find parent component with the store and update it
        // biome-ignore lint/suspicious/noExplicitAny: element traversal requires any
        const findAndSetStore = (el: any): void => {
          if (!el) return;

          const storeName = options?.name ?? String(propertyKey);
          const ctx = el[PENCIL_COMPONENT_CONTEXT];

          if (ctx?.stores?.has(storeName)) {
            const equalFn = options?.equal ?? deepEqual;
            const oldValue = ctx.stores.get(storeName);
            const isEqual = equalFn(value, oldValue);

            if (!isEqual) {
              ctx.stores.set(storeName, value);
              log(fromToText(storeName, oldValue, value));

              const shouldUpdate = el.componentShouldUpdate?.(
                value,
                oldValue,
                storeName,
              );

              if (shouldUpdate !== false) {
                el.render?.();
              }
            }

            return;
          }

          // Check parent
          if (el.parentElement) {
            findAndSetStore(el.parentElement);
          }
        };

        findAndSetStore(this);
      },

      enumerable: true,
      configurable: true,
    });
  };
}
