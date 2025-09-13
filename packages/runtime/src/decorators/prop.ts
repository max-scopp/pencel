import {
  componentCtrl,
  PENCIL_COMPONENT_CONTEXT,
} from "../controllers/component.ts";

/**
 * Property decorator that makes component properties reactive.
 * Changes to these properties will automatically trigger re-renders.
 */
export function Prop(options?: PropOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const propertyName = propertyKey as string;

    // Define getter/setter for the property
    Object.defineProperty(target, propertyName, {
      get() {
        return (
          componentCtrl().getProp(this, propertyName) ?? options?.defaultValue
        );
      },

      set(value: unknown) {
        componentCtrl().setProp(this, propertyName, value);
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
