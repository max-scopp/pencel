import {
  type FunctionalComponent,
  h,
  type JSXElement,
  type Props,
} from "./core/jsx/jsx.ts";

export type * from "./core/jsx/jsx-runtime.js";
export * from "./jsx-runtime.tsx";

export function jsxDEV(
  type: any,
  props: Props,
  key?: any,
  isStaticChildren?: boolean,
  source?: any,
  self?: any,
): JSXElement {
  return h(type, props, props?.children);
}

/**
 * A fragment component that simply returns its children.
 * Useful for grouping multiple elements without adding extra nodes to the DOM.
 */
export const Fragment: FunctionalComponent = (_, children) => children;
