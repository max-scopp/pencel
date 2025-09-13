import {
  PENCIL_COMPONENT_CONTEXT,
  PENCIL_OBSERVED_ATTRIBUTES,
  type PencilComponentContext,
} from "src/controllers/component.ts";
import type { Props } from "./jsx.ts";

export const NODE_TYPE_TEXT = "TEXT";
export const NODE_TYPE_COMMENT = "COMMENT";
export const NODE_TYPE_FRAGMENT = "FRAGMENT";

export type ComponentFunction =
  | ((props: Record<string, unknown>) => JSXElement | null)
  | FunctionalComponent;

export type JSXElement =
  | {
      type: string | ComponentFunction;
      props: Record<string, unknown>;
      children?: Array<
        JSXElement | string | number | boolean | null | VNode | VNode[]
      >;
      key?: string | number;
    }
  | JSXElement[]
  | null
  | string
  | number
  | boolean
  | VNode
  | VNode[];

export type VNode = {
  $type$: string | FunctionalComponent;
  $props$?: Props;
  $children$?: Array<VNode | null>;
  $key$: string | number | null;
  $elm$?: HTMLElement | Text | Comment | DocumentFragment | null;
  $text$?: string;
};

export interface ErrorBoundary {
  catchError(error: Error): void;
  renderError(error: Error): JSXElement | null;
}

export const Fragment: FunctionalComponent = (_, children) => children;

export type FunctionalComponent<TProps = {}> = (
  props: TProps,
  children: VNode[],
) => VNode | VNode[];

export interface CustomElement extends HTMLElement {
  /**
   * Called each time the element is appended into a document-connected element.
   */
  connectedCallback?(): void;

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

export type ConstructablePencilComponent = {
  [PENCIL_OBSERVED_ATTRIBUTES]: string[];
} & (new (
  ...args: any[]
) => ComponentInterface);

export interface ComponentInterface extends CustomElement {
  [PENCIL_COMPONENT_CONTEXT]?: PencilComponentContext;

  componentWillLoad?(): void;
  componentDidLoad?(): void;
  componentShouldUpdate?(): void;
  componentWillRender?(): void;
  componentDidRender?(): void;
  componentWillUpdate?(): void;
  componentDidUpdate?(): void;
  // componentOnReady?(): void;
  render(): JSXElement;
}

export type PencilComponentPhase = "mounting" | "alive" | "disconnected";
