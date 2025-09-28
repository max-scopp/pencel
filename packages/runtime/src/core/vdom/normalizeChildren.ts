import {
  type JSXChild,
  type JSXChildren,
  type VNode,
  VNodeKind,
  type VTextNode,
} from "../vdom/types.ts";

export function normalizeChildren(
  children: JSXChildren,
  parentKey?: string | number | null,
): Array<VNode | null> {
  const result: Array<VNode | null> = [];

  const append = (child: JSXChild) => {
    if (child == null || typeof child === "boolean") return;

    if (Array.isArray(child)) {
      child.forEach(append);
      // key warning for arrays
      child.forEach((c, i) => {
        if (
          c &&
          typeof c !== "string" &&
          typeof c !== "number" &&
          (c as VNode).i == null &&
          parentKey != null
        ) {
          console.warn(
            `[VNode] Each child in an array should have a unique key. Parent key: ${parentKey}, child index: ${i}`,
          );
        }
      });
    } else if (typeof child === "string" || typeof child === "number") {
      result.push({
        k: VNodeKind.Text,
        text: String(child),
        i: null,
      } as VTextNode);
    } else {
      // already a VNode
      result.push(child);
    }
  };

  append(children as JSXChild);

  return result;
}
