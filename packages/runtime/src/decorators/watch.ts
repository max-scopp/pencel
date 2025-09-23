/**
 * Property decorator that watches for changes in a property and executes a callback.
 *
 * @example
 * ```typescript
 * class MyComponent extends HTMLElement {
 *   private _counter = 0;
 *
 *   @Watch('counter')
 *   onCounterChange(newValue: number, oldValue: number) {
 *     console.log(`Counter changed from ${oldValue} to ${newValue}`);
 *   }
 *
 *   set counter(value: number) {
 *     this._counter = value;
 *   }
 *
 *   get counter() {
 *     return this._counter;
 *   }
 * }
 * ```
 */
export function Watch(propertyName: string): MethodDecorator {
  return (target: object, _methodKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    if (!originalMethod || typeof originalMethod !== "function") {
      throw new Error("@Watch can only be used on methods");
    }

    let value = Reflect.get(target, propertyName);

    // Define the property with a getter/setter
    Object.defineProperty(target, propertyName, {
      get() {
        return value;
      },

      set(newValue: unknown) {
        const oldValue = value;
        value = newValue;
        originalMethod.call(this, newValue, oldValue);
      },

      enumerable: true,
      configurable: true,
    });
  };
}
