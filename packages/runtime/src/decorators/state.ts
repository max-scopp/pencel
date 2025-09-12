import { reactiveComponents, triggerUpdate } from "./component.ts";

// Property decorator for reactive state (internal component state)

export function State(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const propertyName = propertyKey as string;

    // Define getter/setter for the property
    Object.defineProperty(target, propertyName, {
      get() {
        const reactive = reactiveComponents.get(this as HTMLElement);
        return reactive?.state.get(propertyName);
      },
      set(value: unknown) {
        const component = this as HTMLElement;
        let reactive = reactiveComponents.get(component);
        if (!reactive) {
          // Initialize reactive system for this component
          reactive = {
            render: () => {
              const instance = this as { render?: () => void };
              instance.render?.();
            },
            props: new Map(),
            state: new Map(),
          };
          reactiveComponents.set(component, reactive);
        }

        const oldValue = reactive.state.get(propertyName);

        if (oldValue !== value) {
          reactive.state.set(propertyName, value);

          // Trigger re-render
          triggerUpdate(component);
        }
      },
      enumerable: true,
      configurable: true,
    });
  };
}
