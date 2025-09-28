import type { CustomElement } from "../types.ts";
import { normalizeChildren } from "../vdom/normalizeChildren.ts";
import { type JSXChildren, type VNode, VNodeKind } from "../vdom/types.ts";
import type { Props, PropsWithChildren } from "./types.ts";

export function Fragment(props: PropsWithChildren): VNode {
  const i = props.key ? String(props.key) : null;

  return {
    k: VNodeKind.Fragment,
    c: normalizeChildren(props.children, i),
    i,
  };
}

/**
 * A meta-component that represents a registered custom element.
 * No tag type is needed — the element is already registered in the DOM.
 */
export function Host(this: CustomElement, props: Props = {}): VNode {
  return {
    k: VNodeKind.Host,
    p: props,
    c: normalizeChildren(
      props.children as JSXChildren,
      props?.key ? String(props.key) : null,
    ),
    el: this,
    i: props?.key ? String(props.key) : null,
  };
}
