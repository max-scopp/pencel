import type { createPerformanceTree } from "@pencil/utils";
import { getVNodeElement } from "src/utils/getVNodeElement.ts";
import { isVNode } from "src/utils/isVNode.ts";
import { setAttributes } from "../attributes.ts";
import { createDOM } from "./create-dom.ts";
import { NODE_TYPE_TEXT, type VNode } from "./types.ts";

const PERF_UPDATE_PREFIX = "update-";
const PERF_REMOVE_PREFIX = "remove-";

export function patch(
  oldVNode: VNode | null,
  newVNode: VNode,
  perf: ReturnType<typeof createPerformanceTree>,
): VNode {
  const newNodeType = String(newVNode.$type$);

  // If old node doesn't exist, create new DOM
  if (!oldVNode) {
    const newNode = createDOM(newVNode, perf);
    newVNode.$elm$ = newNode;
    return newVNode;
  }

  // If nodes are the same reference, no change needed
  if (oldVNode === newVNode) {
    return newVNode;
  }

  // If nodes are different types, replace completely (create new)
  if (oldVNode.$type$ !== newVNode.$type$) {
    const newNode = createDOM(newVNode, perf);
    if (oldVNode.$elm$?.parentNode) {
      oldVNode.$elm$.parentNode.replaceChild(newNode, oldVNode.$elm$);
    }
    newVNode.$elm$ = newNode;
    return newVNode;
  }

  // Update existing node
  const elm = oldVNode.$elm$;
  newVNode.$elm$ = elm;
  if (!elm) {
    return newVNode;
  }

  // Handle text nodes
  if (
    oldVNode.$type$ === NODE_TYPE_TEXT &&
    newVNode.$type$ === NODE_TYPE_TEXT
  ) {
    if (oldVNode.$text$ !== newVNode.$text$) {
      elm.textContent = newVNode.$text$ || "";
    }
    return newVNode;
  }

  // Update props
  setAttributes(elm as HTMLElement, newVNode.$props$);

  const patchName = `${PERF_UPDATE_PREFIX}${newNodeType}`;
  perf.start(patchName);

  // Update children
  const oldChildren = oldVNode.$children$ || [];
  const newChildren = newVNode.$children$ || [];
  const oldLen = oldChildren.length;
  const newLen = newChildren.length;
  const len = Math.min(oldLen, newLen);

  // Update existing children
  for (let i = 0; i < len; i++) {
    const oldChild = oldChildren[i];
    const newChild = newChildren[i];

    if (
      oldChild != null &&
      newChild != null &&
      isVNode(oldChild) &&
      isVNode(newChild)
    ) {
      patch(oldChild, newChild, perf);
    }
  }

  // Remove extra old children
  if (oldLen > newLen) {
    const removeName = `${PERF_REMOVE_PREFIX}${newNodeType}-children`;
    perf.start(removeName);
    for (let i = len; i < oldLen; i++) {
      const child = oldChildren[i];
      if (child && isVNode(child)) {
        const childElement = getVNodeElement(child);
        if (childElement) {
          (elm as HTMLElement).removeChild(childElement);
        }
      }
    }
    perf.end(removeName);
  }

  // Add new children
  if (newLen > oldLen) {
    for (let i = len; i < newLen; i++) {
      const child = newChildren[i];
      if (child != null) {
        const dom = createDOM(child as VNode, perf);
        (elm as HTMLElement).appendChild(dom);
        (child as VNode).$elm$ = dom;
      }
    }
  }

  perf.end(patchName);
  return newVNode;
}
