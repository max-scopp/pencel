import { reactiveComponents, triggerUpdate } from "./component.ts";

// Property decorator for reactive props (can be set via attributes or properties)

// Helper function to initialize reactive system with default values
function initializeReactiveSystem(component: HTMLElement) {
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

    // Initialize default values for all props
    const ctor = (component as { constructor?: unknown }).constructor;
    const propMetadata = ctor
      ? (ctor as { __pencilProps?: Map<string, PropOptions> }).__pencilProps
      : undefined;

    if (propMetadata) {
      for (const [propName, propOptions] of propMetadata) {
        if (
          propOptions.defaultValue !== undefined &&
          !reactive.props.has(propName)
        ) {
          reactive.props.set(propName, propOptions.defaultValue);
        }
      }
    }
  }
  return reactive;
}

export function Prop(options?: PropOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const propertyName = propertyKey as string;

    // Store metadata about props on the class
    const ctor = (target as { constructor?: unknown }).constructor;
    if (ctor && !(ctor as { __pencilProps?: unknown }).__pencilProps) {
      (ctor as { __pencilProps: Map<string, PropOptions> }).__pencilProps =
        new Map<string, PropOptions>();
    }
    if (ctor) {
      (ctor as { __pencilProps: Map<string, PropOptions> }).__pencilProps.set(
        propertyName,
        options || {},
      );
    }

    // Define getter/setter for the property
    Object.defineProperty(target, propertyName, {
      get() {
        const component = this as HTMLElement;
        const reactive = initializeReactiveSystem(component);

        const value = reactive.props.get(propertyName);

        // Return default value if property is not set
        if (value === undefined && options?.defaultValue !== undefined) {
          return options.defaultValue;
        }

        return value;
      },
      set(value: unknown) {
        const component = this as HTMLElement;
        const reactive = initializeReactiveSystem(component);

        const oldValue = reactive.props.get(propertyName);

        if (oldValue !== value) {
          reactive.props.set(propertyName, value);

          // Reflect to attribute if needed
          const propOptions = ctor
            ? (
                ctor as { __pencilProps: Map<string, PropOptions> }
              ).__pencilProps?.get(propertyName)
            : undefined;
          if (propOptions?.reflect) {
            if (value == null) {
              component.removeAttribute(propertyName);
            } else {
              component.setAttribute(propertyName, String(value));
            }
          }

          // Trigger re-render
          triggerUpdate(component);
        }
      },
      enumerable: true,
      configurable: true,
    });
  };
}

export interface PropOptions {
  reflect?: boolean; // Whether to reflect property changes to attributes
  type?: typeof Number | typeof String | typeof Boolean | typeof Date; // Type for attribute conversion
  defaultValue?: unknown; // Default value for the property
}
