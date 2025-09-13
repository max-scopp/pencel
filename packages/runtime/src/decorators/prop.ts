import {
  type ComponentInterface,
  componentCtrl,
} from "../controllers/component.ts";

/**
 * Explicit type conversion function for attribute values.
 *
 * Examples:
 * ```ts
 * // Simple function-based caster
 * const CustomInt = (value: unknown) => Number(value) + 10;
 * const n = CustomInt("32"); // → 42
 *
 * // Class-based day-only date caster
 * class DateDayOnly extends Date {
 *   constructor(value: string | number | Date) {
 *     super(value);
 *     this.setHours(0, 0, 0, 0); // cut time to midnight
 *   }
 * }
 * const d = new DateDayOnly("2025-09-13"); // → Date at midnight
 *
 * // Built-in constructors still usable
 * const num = Number("123"); // → 123
 * const str = String(456);   // → "456"
 * const bool = Boolean(0);   // → false
 * ```
 */
export type TypeCoercionFn<T> = (value: unknown) => T;

/**
 * Function that resolves attribute name from property name.
 * e.g. myPropName → my-prop-name
 */
export type AttrResolver = (propName: string | symbol) => string;

export interface PropOptions {
  /**
   * Name of the corresponding attribute.
   * If not provided, the property name is used in dash-case.
   */
  attr?: string | AttrResolver;

  /**
   * Whether to reflect property changes to attributes
   */
  reflect?: boolean;

  /**
   * Default value for the property
   */
  defaultValue?: unknown;

  /**
   * Explicit type conversion function for attribute values.
   */
  type?: TypeCoercionFn<unknown>;
}

/**
 * Property decorator that makes component properties reactive.
 * Changes to these properties will automatically trigger re-renders.
 */
export function Prop(options?: PropOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const propertyName = propertyKey as string;

    componentCtrl().initProp(
      target as ComponentInterface,
      propertyName,
      options,
    );

    // Define getter/setter for the property
    Object.defineProperty(target, propertyName, {
      get() {
        return componentCtrl().getProp(this, propertyName);
      },

      set(value: unknown) {
        componentCtrl().setProp(this, propertyName, value);
      },

      enumerable: true,
      configurable: true,
    });
  };
}
