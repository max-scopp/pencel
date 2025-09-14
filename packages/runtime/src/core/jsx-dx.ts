import type { FunctionalComponent } from "./jsx.ts";
import { NODE_TYPE_HOST, type VNode } from "./vdom/types.ts";

/**
 * A fragment component that simply returns its children.
 * Useful for grouping multiple elements without adding extra nodes to the DOM.
 */
export const Fragment: FunctionalComponent = (_, children) => children;

/**
 * A meta-component that represents the host element of a web component.
 * It allows passing props and children to the host element.
 */
export const Host: FunctionalComponent = (hostProps, children) =>
  ({
    $type$: NODE_TYPE_HOST,
    $props$: hostProps,
    $children$: children,
    $key$: null,
  }) satisfies VNode;
