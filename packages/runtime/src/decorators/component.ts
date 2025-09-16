import {
  ConsumerError,
  createLog,
  getExtendsByInheritance,
} from "@pencel/utils";
import { pencilConfig } from "src/config.ts";
import type { ConstructablePencilComponent } from "src/core/types.ts";
import { wrapComponentForRegistration } from "src/pencilCustomElementWrap.ts";

const log = createLog("Component");

export interface ComponentOptions {
  tag?: string;
  /**
   * @deprecated not implemented yet
   */
  assetsDirs?: string[];
  formAssociated?: boolean;
  /**
   * Not implemented yet
   */
  scoped?: boolean;

  shadow?: boolean;

  /**
   * A path, relative to the component file to always include
   * to style the custom element.
   */
  styleUrl?: string;

  /**
   * A map of paths, relative to the component file to use when the
   * key is matching the current mode to style the custom element.
   */
  styleUrls?: Record<string, string>;

  /**
   * CSS styles to include in the custom element.
   */
  styles?: string | string[];

  /**
   * Manual extends for custom-element's define options.
   */
  extends?: string;
}

export type SafeComponentOptions = Omit<
  Required<ComponentOptions>,
  "styles" | "styleUrl" | "extends"
> & {
  styles: string[];
  extends?: string;
} & (
    | { shadow: true; scoped: false }
    | { shadow: false; scoped: true }
    | { shadow: false; scoped: false }
  );

function interopOptionsByUsage(
  options: ComponentOptions,
): SafeComponentOptions {
  if (options.scoped && options.shadow) {
    throw new ConsumerError("Cannot use both scoped and shadow styles");
  }

  if (options.extends && options.shadow) {
    throw new ConsumerError(
      "Cannot use shadow DOM with customized built-in elements",
    );
  }

  const scopedShadowPair = options.extends
    ? ({ scoped: false, shadow: false } as const)
    : options.scoped
      ? ({ scoped: true, shadow: false } as const)
      : ({ scoped: false, shadow: true } as const);

  const styleUrls = [...(options.styleUrls || [])];

  if (options.styleUrl) {
    styleUrls.push(options.styleUrl);
  }

  return {
    ...scopedShadowPair,
    extends: options.extends,
    tag:
      options.tag ??
      (() => {
        throw new ConsumerError("Tag is required");
      })(),
    assetsDirs: options.assetsDirs || [],
    formAssociated: options.formAssociated,
    styleUrls,
    styles:
      typeof options.styles === "string"
        ? [options.styles]
        : options.styles || [],
  };
}

/**
 * Registers the component with the custom elements registry
 */
function defineCustomElement(
  klass: CustomElementConstructor,
  tagName: string,
  extendsByInheritance?: string,
) {
  log(
    "define",
    undefined,
    tagName + (extendsByInheritance ? ` extends ${extendsByInheritance}` : ""),
  );

  if (extendsByInheritance) {
    // Customized built-in element
    customElements.define(tagName, klass, {
      extends: extendsByInheritance,
    });
  } else {
    // Autonomous custom element
    customElements.define(tagName, klass);
  }
}

/**
 * Generates a tag name for the component
 */
function generateTagName(options: ComponentOptions): string {
  return [pencilConfig.tagNamespace, options.tag].filter(Boolean).join("-");
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
 * @Component({ tagName: "my-button" })
 * class MyButton extends HTMLButtonElement {
 *   @Prop() label = "Click me";
 *
 *   render() {
 *     return <button>{this.label}</button>;
 *   }
 * }
 * ```
 */
export const Component = (userOptions?: ComponentOptions): ClassDecorator => {
  return (klass: object) => {
    if (typeof customElements === "undefined") {
      log("skip define - no registry");
      return klass as any;
    }

    const customElementExtends = userOptions?.extends
      ? userOptions?.extends
      : getExtendsByInheritance(klass);

    const options = interopOptionsByUsage({
      ...userOptions,
      extends: customElementExtends,
    });

    const tagName = generateTagName(options);

    const wrappedKlass = wrapComponentForRegistration(
      klass as unknown as ConstructablePencilComponent,
      options,
      customElementExtends,
    );

    defineCustomElement(wrappedKlass, tagName, customElementExtends);

    return wrappedKlass as any;
  };
};
