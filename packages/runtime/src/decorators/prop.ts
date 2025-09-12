import { reactiveComponents, triggerUpdate } from "./component.ts";

// Property decorator for reactive props (can be set via attributes or properties)

interface PencilPropsMetadata {
  __pencilProps?: Map<string, PropOptions>;
}

/**
 * Initializes the reactive system for a component, setting up default values
 * for all props that have them defined.
 */
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
    const metadata = getPropsMetadata(component);
    if (metadata) {
      for (const [propName, propOptions] of metadata) {
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

/**
 * Gets the props metadata map from a component's constructor
 */
function getPropsMetadata(
  component: HTMLElement,
): Map<string, PropOptions> | undefined {
  const ctor = (component as { constructor?: unknown }).constructor;
  return ctor ? (ctor as PencilPropsMetadata).__pencilProps : undefined;
}

/**
 * Stores props metadata on the component's constructor
 */
function setPropsMetadata(
  target: object,
  propertyName: string,
  options: PropOptions,
) {
  const ctor = (target as { constructor?: unknown }).constructor;
  if (!ctor) return;

  const metadata = ctor as PencilPropsMetadata;
  if (!metadata.__pencilProps) {
    metadata.__pencilProps = new Map<string, PropOptions>();
  }
  metadata.__pencilProps.set(propertyName, options || {});
}

/**
 * Property decorator that makes component properties reactive.
 * Changes to these properties will automatically trigger re-renders.
 */
export function Prop(options?: PropOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const propertyName = propertyKey as string;

    // Store metadata about props on the class
    setPropsMetadata(target, propertyName, options || {});

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
          const propOptions = getPropsMetadata(component)?.get(propertyName);
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
