import { reactiveComponents, triggerUpdate } from "./component.ts";

// Property decorator for reactive state (internal component state)

/**
 * Gets or creates the reactive system for a component
 */
function getOrCreateReactiveSystem(component: HTMLElement) {
  let reactive = reactiveComponents.get(component);
  if (!reactive) {
    reactive = {
      render: () => {
        const instance = component as { render?: () => void };
        instance.render?.();
      },
      props: new Map(),
      state: new Map(),
    };
    reactiveComponents.set(component, reactive);
  }
  return reactive;
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
export function State(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const propertyName = propertyKey as string;

    // Define getter/setter for the state property
    Object.defineProperty(target, propertyName, {
      get() {
        const component = this as HTMLElement;
        const reactive = reactiveComponents.get(component);
        return reactive?.state.get(propertyName);
      },

      set(value: unknown) {
        const component = this as HTMLElement;
        const reactive = getOrCreateReactiveSystem(component);

        const oldValue = reactive.state.get(propertyName);

        // Only update if the value has actually changed
        if (oldValue !== value) {
          reactive.state.set(propertyName, value);

          // Trigger re-render to reflect the state change
          triggerUpdate(component);
        }
      },

      enumerable: true,
      configurable: true,
    });
  };
}
