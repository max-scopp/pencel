import { NODE_TYPE_HOST, type VNode } from "../vdom/types.ts";
import type { FunctionalComponent } from "./jsx.ts";

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
