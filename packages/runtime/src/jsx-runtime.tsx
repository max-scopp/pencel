import type { ComponentFunction } from "./core/jsx/types.ts";
import { getVNodeKind } from "./core/vdom/getVNodeKind.ts";
import { normalizeChildren } from "./core/vdom/normalizeChildren.ts";
import { type JSXChildren, type VNode, VNodeKind } from "./core/vdom/types.ts";

export * from "./core/jsx/jsx.js";

export * from "./core/jsx/jsx-helpers.ts";

/**
 * jsx/jsxs for production
 */

export function jsx(
  type: string | ComponentFunction,
  props: { children?: JSXChildren; key?: string | number } = {},
  key?: string | number,
): VNode {
  const kind = getVNodeKind(type);
  const children = normalizeChildren(props.children, props.key ?? key ?? null);

  if (kind === VNodeKind.Component) {
    return {
      k: VNodeKind.Component,
      f: type as ComponentFunction,
      p: props,
      c: children,
      i: props.key ?? key ?? null,
    };
  }

  if (kind === VNodeKind.Host) {
    return {
      k: VNodeKind.Host,
      p: props,
      c: children,
      el: null as unknown as HTMLElement, // TODO: will be set later
      i: props.key ?? key ?? null,
    };
  }

  // literal tag
  return {
    k: VNodeKind.Tag,
    tag: type as string,
    p: props,
    c: children,
    i: props.key ?? key ?? null,
  };
}

export { jsx as jsxs };
