import type { JSXElement, VNode } from "./types.ts";

export type Props = Record<string, unknown> ;
export type ComponentType = (props: Props) => JSXElement | null;

export function h(
  type: string | ComponentType,
  props?: Props | null,
  ...children: unknown[]
): JSXElement {
  return {
    type,
    props: props || {},
    children: children
      .flat()
      .map((child) =>
        typeof child === "string" ||
        typeof child === "number" ||
        typeof child === "boolean" ||
        child === null
          ? child
          : (child as JSXElement),
      ),
    key: props?.key as string | number | undefined,
  };
}

export function toVNode(jsx: JSXElement): VNode {
  return {
    type: jsx.type,
    props: jsx.props,
    children: jsx.children.map((child) =>
      typeof child === "string" ||
      typeof child === "number" ||
      typeof child === "boolean" ||
      child === null
        ? child
        : toVNode(child),
    ),
    key: jsx.key ?? null,
    $elm$: null,
  };
}
