import { createPerformanceTree } from "@pencil/utils";
import { setAttributes } from "./attributes.ts";
import { toVNode } from "./jsx.ts";
import type { JSXElement, VNode } from "./types.ts";

// Extend HTMLElement to include our internal storage
declare global {
  interface HTMLElement {
    __$pencil_internals$?: {
      vnode?: VNode;
    };
  }
}

export function render(jsx: JSXElement, container: HTMLElement): void {
  // Create a new performance tree for this render cycle
  const renderPerf = createPerformanceTree();
  renderPerf.start("render-cycle");

  container.__$pencil_internals$ ??= {};

  const newVNode = toVNode(jsx);

  // Get the previously rendered VNode from the container
  const oldVNode = container.__$pencil_internals$?.vnode;

  if (oldVNode) {
    // Update existing content using patch
    const updatedVNode = patch(oldVNode, newVNode, renderPerf);

    // Store the updated VNode for future renders
    container.__$pencil_internals$.vnode = updatedVNode;
  } else {
    // First render - create new DOM
    const newNode = createDOM(newVNode, renderPerf);

    container.appendChild(newNode);

    // Store the VNode for future renders
    container.__$pencil_internals$.vnode = newVNode;
  }

  renderPerf.end("render-cycle");

  // Log performance after render completes
  renderPerf.log();
}

function createDOM(
  vnode: VNode,
  perf: ReturnType<typeof createPerformanceTree>,
): HTMLElement | Text | Comment {
  perf.start(`create-${vnode.$type$}`);

  if (vnode.$type$ === "COMMENT") {
    const comment = document.createComment(vnode.$text$ || "");
    vnode.$elm$ = comment;
    perf.end(`create-${vnode.$type$}`);
    return comment;
  }

  if (vnode.$type$ === "TEXT") {
    const text = document.createTextNode(vnode.$text$ || "");
    vnode.$elm$ = text;
    perf.end(`create-${vnode.$type$}`);
    return text;
  }

  if (
    typeof vnode === "string" ||
    typeof vnode === "number" ||
    typeof vnode === "boolean"
  ) {
    const result = document.createTextNode(String(vnode));
    // Note: This case should not be reached as toVNode converts primitives
    perf.end(`create-${(vnode as VNode).$type$}`);
    return result;
  }

  const element = document.createElement(vnode.$type$ as string);

  // Set attributes and properties
  setAttributes(element, vnode.$props$);

  // Create and append children
  vnode.$children$?.forEach((child) => {
    if (child != null) {
      element.appendChild(createDOM(child as VNode, perf));
    }
  });

  vnode.$elm$ = element;
  perf.end(`create-${vnode.$type$}`);
  return element;
}

export function patch(
  oldVNode: VNode | null,
  newVNode: VNode,
  perf: ReturnType<typeof createPerformanceTree>,
): VNode {
  const patchName = oldVNode ? `patch-${oldVNode.$type$}` : "patch-null";
  perf.start(patchName);

  // If old node doesn't exist, create new DOM
  if (!oldVNode) {
    const newNode = createDOM(newVNode, perf);
    newVNode.$elm$ = newNode;
    perf.end(patchName);
    return newVNode;
  }

  // If nodes are the same reference, no change needed
  if (oldVNode === newVNode) {
    perf.end(patchName);
    return newVNode;
  }

  // If nodes are different types, replace completely
  if (oldVNode.$type$ !== newVNode.$type$) {
    const newNode = createDOM(newVNode, perf);
    if (oldVNode.$elm$?.parentNode) {
      oldVNode.$elm$.parentNode.replaceChild(newNode, oldVNode.$elm$);
    }
    newVNode.$elm$ = newNode;
    perf.end(patchName);
    return newVNode;
  }

  // Update existing node
  const elm = oldVNode.$elm$;
  newVNode.$elm$ = elm;
  if (!elm) {
    perf.end(patchName);
    return newVNode;
  }

  // Handle text nodes
  if (oldVNode.$type$ === "TEXT" && newVNode.$type$ === "TEXT") {
    if (oldVNode.$text$ !== newVNode.$text$) {
      elm.textContent = newVNode.$text$ || "";
    }
    perf.end(patchName);
    return newVNode;
  }

  // Update props
  setAttributes(elm as HTMLElement, newVNode.$props$);

  // Update children recursively
  const oldChildren = oldVNode.$children$ || [];
  const newChildren = newVNode.$children$ || [];
  const oldLen = oldChildren.length;
  const newLen = newChildren.length;
  const len = Math.min(oldLen, newLen);

  // Update existing children
  for (let i = 0; i < len; i++) {
    const oldChild = oldChildren[i];
    const newChild = newChildren[i];

    if (oldChild != null && newChild != null) {
      patch(oldChild as VNode, newChild as VNode, perf);
    }
  }

  // Remove extra old children
  if (oldLen > newLen) {
    for (let i = len; i < oldLen; i++) {
      const child = oldChildren[i];
      if (child && typeof child === "object" && "$elm" in child && child.$elm) {
        elm.removeChild(child.$elm as Node);
      }
    }
  }

  // Add new children
  if (newLen > oldLen) {
    for (let i = len; i < newLen; i++) {
      const child = newChildren[i];
      if (child != null) {
        const dom = createDOM(child as VNode, perf);
        elm.appendChild(dom);
        (child as VNode).$elm$ = dom;
      }
    }
  }

  perf.end(patchName);
  return newVNode;
}
