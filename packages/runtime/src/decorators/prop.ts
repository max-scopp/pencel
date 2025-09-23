import { ConsumerError } from "@pencel/utils";
import { componentCtrl } from "../controllers/component.ts";
import {
  ATTR_MAP,
  type ComponentInterfaceWithContext,
  PROP_NAMES,
} from "../core/types.ts";
import { resolveAttributeName } from "../utils/attributes.ts";

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
export type AttrResolver = (propName: string | number | symbol) => string;

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
   * By default, properties are immutable after initialization, meaning that
   * setting them after the component is first rendered will throw an error.
   *
   * Set this to `true` to allow changing the property value.
   */
  mutable?: boolean;

  /**
   * Value used when the property isn't initially set, or was unset by removing the attribute.
   */
  fallbackValue?: unknown;

  /**
   * Explicit type conversion function for attribute values.
   * `null` means no conversion (default).
   */
  type?: null | TypeCoercionFn<unknown>;
}

/**
 * Property decorator that makes component properties reactive.
 * Changes to these properties will automatically trigger re-renders.
 */
export function Prop(options?: PropOptions): PropertyDecorator {
  return (target, propertyKey) => {
    const component = target as ComponentInterfaceWithContext;
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
        if (options?.mutable) {
          ctrl.setProp(this, propertyName, value);
        }

        throw new ConsumerError(
          `Property "${propertyName}" is immutable. To make it mutable, set the "mutable" option to true in the @Prop() decorator.`,
        );
      },

      enumerable: true,
      configurable: true,
    });
  };
}
