import type { CustomElement } from "../core/types.ts";

export type ListenTargetOptions = "body" | "document" | "window";

/**
 * Options for the Listen decorator
 */
export interface ListenOptions extends AddEventListenerOptions {
  /**
   * Name of the event to listen for
   */
  eventName: string;

  /**
   * Target for event listener attachment. Defaults to host element.
   * Use this to listen for application-wide events.
   */
  target?: ListenTargetOptions;
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
export function Listen(
  userOptions: string | ListenOptions,
  backwardsOptionsArg?: Omit<ListenOptions, "eventName">,
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const { eventName, ...options } =
      typeof userOptions === "string"
        ? { eventName: userOptions, ...backwardsOptionsArg }
        : { ...userOptions, ...backwardsOptionsArg };

    const originalMethod = descriptor.value;

    if (typeof originalMethod !== "function") {
      throw new Error(
        `@Listen can only be applied to methods, but ${String(propertyKey)} is not a function`,
      );
    }

    const getTargetElm = () => {
      switch (options.target) {
        case "body":
          return document.body;
        case "document":
          return document;
        case "window":
          return window;
        default:
          return null;
      }
    };

    // TODO: Implement disconnect logic to remove event listener

    const ctor = target.constructor as { new (): CustomElement };

    const originalConnectedCallback = ctor.prototype
      .connectedCallback as CustomElement["connectedCallback"];

    ctor.prototype.connectedCallback = function () {
      const targetElm = getTargetElm() ?? this;
      targetElm.addEventListener(eventName, this[propertyKey], options);

      originalConnectedCallback?.call(this);
    };

    return descriptor;
  };
}
