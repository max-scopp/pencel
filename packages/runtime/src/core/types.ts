import {
  PENCIL_COMPONENT_CONTEXT,
  PENCIL_OBSERVED_ATTRIBUTES,
  type PencilComponentContext,
} from "src/controllers/component.ts";
import type { AttrResolver, PropOptions } from "src/decorators/prop.ts";
import type { JSXElement } from "./jsx.ts";

/**
 * The Custom Elements API interface that all Pencil components implement.
 */
export interface CustomElement extends HTMLElement {
  /**
   * Called each time the element is appended into a document-connected element.
   */
  connectedCallback?(): void | Promise<void>;

  /**
   * Called each time the element is disconnected from the document's DOM.
   */
  disconnectedCallback?(): void;

  /**
   * Called when one of the element’s observed attributes is added, removed, or changed.
   */
  attributeChangedCallback?(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;

  /**
   * Called each time the element is moved to a new document.
   */
  adoptedCallback?(oldDocument: Document, newDocument: Document): void;
}

/**
 * A Pencil component that is not yet instantiated.
 *
 * `PENCIL_OBSERVED_ATTRIBUTES` holds the list of attributes observed
 * over the initialization phase for the `observedAttributes` implementation
 * by the Custom Elements API.
 *
 * @public
 */
export type ConstructablePencilComponent = {
  [PENCIL_OBSERVED_ATTRIBUTES]: string[];
} & (new (
  ...args: any[]
) => ComponentInterfaceWithContext);

/**
 * Each consumer facing component registration using `@Component` decorator
 * is being wrapped to support the infrastructure needs before it's being
 * registered as a Custom Element.
 *
 * This interface reflects the internal structure of the internal wrapped component.
 *
 * Child instances of `ComponentInterfaceWithContext` will NOT have these properties.
 *
 * @private
 */
export interface ComponentInterfaceWithContext
  extends ComponentInterfaceBaseMeta {
  [PENCIL_COMPONENT_CONTEXT]?: PencilComponentContext;
}

export const PROP_NAMES: unique symbol = Symbol("__$pencil_prop_names$");
export const ATTR_MAP: unique symbol = Symbol("__$pencil_attr_map$");

/**
 * Applied to the consumer component instance to include metadata
 * about the decorated properties, making them easier to access later.
 *
 * Currently, this is mainly required to cleanly initialize the props.
 *
 * @private
 */
export interface ComponentInterfaceBaseMeta extends ComponentInterface {
  [PROP_NAMES]?: Map<string, PropOptions | undefined>;
  [ATTR_MAP]?: Map<string, string>;
}

/**
 * Consumer facing interface for Pencil components.
 *
 * @public
 */
export interface ComponentInterface extends CustomElement {
  /**
   * Called once just after the component is first connected to the DOM.
   */
  componentWillLoad?(): void | Promise<void>;

  /**
   * Called once just after the component has loaded and rendered for the first time.
   */
  componentDidLoad?(): void;

  /**
   * Called before each render, including the first one.
   */
  componentShouldUpdate?<TValue>(
    newValue: TValue,
    oldValue: TValue | undefined,
    propName: string | symbol,
  ): boolean;

  /**
   * Called before rendering when new props or state are being received and
   * the component will re-render. You cannot call `setState` here.
   */
  componentWillRender?(): void | Promise<void>;

  /**
   * Called after each render of the component.
   */
  componentDidRender?(): void;

  /**
   * Called before `componentWillRender` when the component is about to update.
   * Is not called on the first render.
   */
  componentWillUpdate?(): void;

  /**
   * Called after the component has been updated.
   * Is not called on the first render.
   */
  componentDidUpdate?(): void;

  /**
   * The render method that returns the JSX to render.
   */
  render?(): JSXElement;
}

/**
 * The phase of the component in its lifecycle.
 *
 * A component is considered "alive" immediately after the consumer's `componentWillLoad`
 * lifecycle hook has completed successfully and all internal setup is finished,
 * but before the first render is attempted.
 *
 * A component can be alive without ever being rendered once if the scheduler
 * decides not to render it for some reason (e.g., it is not attached to the DOM).
 *
 * @private
 */
export type PencilComponentPhase = "mounting" | "alive" | "disconnected";
