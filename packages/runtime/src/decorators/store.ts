import { deepEqual } from "src/utils/equal.ts";
import { componentCtrl } from "../controllers/component.ts";

export interface StoreOptions {
  /**
   * Smiliar to `shouldComponentUpdate`, but for this specific state property.
   *
   * This function is called whenever the setter of this state property is invoked.
   */
  equal?: (a: unknown, b: unknown) => boolean;
}

export interface ConnectOptions extends StoreOptions {
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
  return (target: object, propertyKey: string | symbol) => {
    // Define getter/setter for the state property
    Object.defineProperty(target, propertyKey, {
      get() {
        return componentCtrl().getStore(this, propertyKey);
      },

      set(value: unknown) {
        const ctrl = componentCtrl();

        const equalFn = options?.equal ?? deepEqual;

        const isEqual = equalFn(value, ctrl.getStore(this, propertyKey));

        if (!isEqual) {
          ctrl.setStore(this, propertyKey, value);
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
    // Define getter/setter for the state property
    Object.defineProperty(target, propertyKey, {
      get() {
        const sctx = componentCtrl().findStore(
          this,
          options?.name ?? String(propertyKey),
        );

        return sctx.store;
      },

      set(value: unknown) {
        const ctrl = componentCtrl();

        const equalFn = options?.equal ?? deepEqual;

        const isEqual = equalFn(value, ctrl.getStore(this, propertyKey));

        if (!isEqual) {
          const sctx = componentCtrl().findStore(
            this,
            options?.name ?? String(propertyKey),
          );

          ctrl.setStore(sctx.component, propertyKey, value);
        }
      },

      enumerable: true,
      configurable: true,
    });
  };
}
