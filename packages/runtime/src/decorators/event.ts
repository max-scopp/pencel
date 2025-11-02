import { createLog, dashCase } from "@pencel/utils";
import type { ComponentInterface } from "../core/types.ts";

const log = createLog("EventDecorator");

export class EventEmitter<T = never> {
  constructor(
    protected readonly getElement: () => HTMLElement,
    protected readonly options: EventOptions & Required<Pick<EventOptions, "eventName">>,
  ) {}

  emit(data: T): boolean {
    const { eventName, ...eventInit } = this.options;
    const evt = new CustomEvent<T>(eventName, {
      detail: data,
      ...eventInit,
    });

    const result = this.getElement().dispatchEvent(evt);

    log(`Event "${eventName}" emitted with data: ${JSON.stringify(data, null, 4)}`);

    return result;
  }
}

export interface EventOptions {
  /**
   * The name of the event to be emitted.
   *
   * If not provided, the property key will be used in dash-case format.
   */
  eventName?: string;

  /**
   * Indicating whether the event bubbles up through the DOM or not.
   */
  bubbles?: boolean;

  /**
   * Indicating whether the event is cancelable.
   */
  cancelable?: boolean;

  /**
   * Indicating whether or not the event can bubble across the boundary between
   * the shadow DOM and the regular DOM.
   */
  composed?: boolean;
}

/**
 * Property decorator that makes component state reactive.
 * Changes to state properties will automatically trigger re-renders.
 *
 * @example
 * ```typescript
 * class MyComponent extends HTMLElement {
 *   @State() counter = 0;
 *
 *   increment() {
 *     this.counter++; // This will trigger a re-render
 *   }
 * }
 * ```
 */
export function Event(userOptions?: string | EventOptions): PropertyDecorator {
  return (target, propertyKey) => {
    let instance: ComponentInterface;

    const { eventName, ...options } =
      typeof userOptions === "string" ? { eventName: userOptions } : (userOptions ?? {});

    const emitter = new EventEmitter(() => instance, {
      eventName: eventName ?? dashCase(String(propertyKey)),
      ...options,
    });

    // Define getter/setter for the state property
    Object.defineProperty(target, propertyKey, {
      get() {
        instance = this;
        return emitter;
      },

      set() {
        throw new Error(
          "You cannot set the value of an @Event property. You should use new EventEmitter(options).emit(data) instead.",
        );
      },

      enumerable: true,
      configurable: true,
    });
  };
}
