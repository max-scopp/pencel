import {
  ATTR_MAP,
  type ComponentInterfaceBaseMeta,
  PROP_NAMES,
} from "src/core/types.ts";
import { resolveAttributeName } from "src/utils/attributes.ts";
import { componentCtrl } from "../controllers/component.ts";

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
   * Value used when the property isn't initially set, or was unset by removing the attribute.
   */
  fallbackValue?: unknown;

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
    const component = target as ComponentInterfaceBaseMeta;
    const propertyName = propertyKey as string;
    const ctrl = componentCtrl();

    component[PROP_NAMES] ??= new Map();
    component[PROP_NAMES].set(propertyName, options);

    component[ATTR_MAP] ??= new Map();
    component[ATTR_MAP].set(resolveAttributeName(propertyName), propertyName);

    Object.defineProperty(component, propertyName, {
      get() {
        return ctrl.getProp(this, propertyName);
      },

      set(value: unknown) {
        ctrl.setProp(this, propertyName, value);
      },

      enumerable: true,
      configurable: true,
    });
  };
}
