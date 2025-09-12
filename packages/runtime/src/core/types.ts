import type { Props } from "./jsx.ts";

export type JSXElement = {
  type: string | ((props: Record<string, unknown>) => JSXElement | null);
  props: Record<string, unknown>;
  children: Array<JSXElement | string | number | boolean | null>;
  key?: string | number;
};

export type VNode = {
  type: string | ((props: Record<string, unknown>) => VNode | null);
  props?: Props;
  children?: Array<VNode | string | number | boolean | null>;
  key: string | number | null;
  $elm$?: HTMLElement | null;
  $text$?: string;
};

// export interface Component {
//   render(): JSXElement | null;
// }
export type Component<TProps = any> = any;

export interface LifecycleHooks {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  attributeChangedCallback?(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
}

export interface ErrorBoundary {
  catchError(error: Error): void;
  renderError(error: Error): JSXElement | null;
}

export const Fragment = Symbol("Fragment");
