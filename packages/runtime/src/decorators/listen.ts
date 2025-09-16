import { ConsumerError } from "@pencel/utils";
import type { CustomElement } from "../core/types.ts";

/**
 * Options for the Listen decorator
 */
export interface ListenOptions extends AddEventListenerOptions {
  /**
   * Name of the event to listen for
   */
  eventName: string;
}

/**
 * Method decorator that listens for events on the class instance using addEventListener.
 * When the specified event occurs, the decorated method is called.
 *
 * @example
 * ```ts
 * class MyComponent extends HTMLElement {
 *   @Listen({ eventName: 'click' })
 *   handleClick(event: Event) {
 *     console.log('Clicked!', event);
 *   }
 * }
 * ```
 */
export function Listen(userOptions: string | ListenOptions): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const { eventName, ...options } =
      typeof userOptions === "string"
        ? { eventName: userOptions }
        : userOptions;

    const originalMethod = descriptor.value;

    if (typeof originalMethod !== "function") {
      throw new ConsumerError(
        `@Listen can only be applied to methods, but ${String(propertyKey)} is not a function`,
      );
    }

    // TODO: Implement disconnect logic to remove event listener

    const ctor = target.constructor as { new (): CustomElement };

    const originalConnectedCallback = ctor.prototype
      .connectedCallback as CustomElement["connectedCallback"];

    ctor.prototype.connectedCallback = function () {
      this.addEventListener(eventName, this[propertyKey], options);

      originalConnectedCallback?.call(this);
    };

    return descriptor;
  };
}
