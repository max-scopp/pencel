import type { createPerformanceTree } from "@pencil/utils";
import { isVNode } from "src/utils/isVNode.ts";
import { setAttributes } from "../attributes.ts";
import { NODE_TYPE_COMMENT, NODE_TYPE_TEXT, type VNode } from "./types.ts";

const PERF_CREATE_PREFIX = "create-";

export function createDOM(
  vnode: VNode,
  perf: ReturnType<typeof createPerformanceTree>,
): HTMLElement | Text | Comment {
  const nodeType = String(vnode.$type$);

  if (vnode.$type$ === NODE_TYPE_COMMENT) {
    const comment = document.createComment(vnode.$text$ || "");
    vnode.$elm$ = comment;
    return comment;
  }

  if (vnode.$type$ === NODE_TYPE_TEXT) {
    const text = document.createTextNode(vnode.$text$ || "");
    vnode.$elm$ = text;
    return text;
  }

  if (
    typeof vnode === "string" ||
    typeof vnode === "number" ||
    typeof vnode === "boolean"
  ) {
    const result = document.createTextNode(String(vnode));
    return result;
  }

  // Only log performance for element creation (text/comment creation is negligible)
  perf.start(`${PERF_CREATE_PREFIX}${nodeType}`);

  const element = vnode.$props$?.is
    ? document.createElement(String(vnode.$type$), {
        is: String(vnode.$props$.is),
      })
    : document.createElement(String(vnode.$type$));

  // Set attributes and properties
  setAttributes(element, vnode.$props$);

  // Create all children at once
  if (vnode.$children$ && vnode.$children$.length > 0) {
    for (const child of vnode.$children$) {
      if (child != null && isVNode(child)) {
        const childElement = createDOM(child, perf);
        element.appendChild(childElement);
      }
    }
  }

  vnode.$elm$ = element;
  perf.end(`${PERF_CREATE_PREFIX}${nodeType}`);
  return element;
}
