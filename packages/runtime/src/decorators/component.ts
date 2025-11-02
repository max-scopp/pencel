import { wrapComponentForRegistration } from "../core/pencilCustomElementWrap.tsx";
import type { ConstructablePencilComponent } from "../core/types.ts";
import { INTERNALS } from "../internals.ts";

export interface ComponentInternals {
  /**
   * Processed styles string for the component.
   */
  styles: string;
  /**
   * Processed style URLs for the component.
   */
  styleUrls: Record<string, string>;
}

export interface ComponentOptions {
  tag: string;
  shadow?: boolean;
  scoped?: boolean;
  styles?: string | string[];
  styleUrl?: string;
  styleUrls?: Record<string, string>;
  extends?: string;
  formAssociated?: boolean;

  [INTERNALS]?: ComponentInternals;
}

/**
 * Component decorator that registers a class as a custom element.
 * Handles reactive props, attribute observation, and lifecycle management.
 *
 * @param options Configuration options for the component
 * @returns A class decorator function
 *
 * @example
 * ```typescript
 * @Component({ tag: "my-button" })
 * class MyButton extends HTMLButtonElement {
 *   @Prop() label = "Click me";
 *
 *   render() {
 *     return <button>{this.label}</button>;
 *   }
 * }
 * ```
 */
export const Component = (options: ComponentOptions): ClassDecorator => {
  return <TFunction extends object>(klass: TFunction) => {
    if (typeof customElements === "undefined") {
      return klass;
    }

    const wrappedKlass = wrapComponentForRegistration(
      klass as unknown as ConstructablePencilComponent,
      options,
      options.extends,
    );

    if (options.extends) {
      customElements.define(options.tag, wrappedKlass as CustomElementConstructor, {
        extends: options.extends,
      });
    } else {
      customElements.define(options.tag, wrappedKlass as CustomElementConstructor);
    }

    return wrappedKlass as unknown as TFunction;
  };
};
