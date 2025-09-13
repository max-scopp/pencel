import type { createPerformanceTree } from "@pencil/utils";
import { getVNodeElement } from "src/utils/getVNodeElement.ts";
import { isVNode } from "src/utils/isVNode.ts";
import { setAttributes } from "../attributes.ts";
import { NODE_TYPE_FRAGMENT, NODE_TYPE_TEXT, type VNode } from "../types.ts";
import { createDOM } from "./create-dom.ts";

const PERF_UPDATE_PREFIX = "update-";
const PERF_REMOVE_PREFIX = "remove-";

// Helper function for key-based children reconciliation
function reconcileChildrenByKey(
  parentElm: HTMLElement,
  oldChildren: (VNode | null)[],
  newChildren: (VNode | null)[],
  perf: ReturnType<typeof createPerformanceTree>,
  isFragment: boolean,
): void {
  const oldKeyMap = new Map<string | number, VNode>();
  const newKeyMap = new Map<string | number, VNode>();

  // Build maps of keyed children
  oldChildren.forEach((child) => {
    if (child && isVNode(child) && child.$key$ != null) {
      oldKeyMap.set(child.$key$, child);
    }
  });

  newChildren.forEach((child) => {
    if (child && isVNode(child) && child.$key$ != null) {
      newKeyMap.set(child.$key$, child);
    }
  });

  // Process new children
  let lastPlacedNode: Node | null = null;

  newChildren.forEach((newChild) => {
    if (!newChild || !isVNode(newChild)) return;

    const key = newChild.$key$;
    const oldChild = key != null ? oldKeyMap.get(key) : null;

    if (oldChild) {
      // Child exists, patch it
      patch(oldChild, newChild, perf, parentElm);

      // Move to correct position if needed
      const oldElm = getVNodeElement(oldChild);
      if (oldElm && lastPlacedNode && oldElm !== lastPlacedNode.nextSibling) {
        if (!isFragment) {
          parentElm.insertBefore(oldElm, lastPlacedNode.nextSibling);
        }
      }
      lastPlacedNode = oldElm;
    } else {
      // New child, create it
      const newElm = createDOM(newChild, perf);
      newChild.$elm$ = newElm; // Ensure VNode is connected to DOM element
      if (!isFragment) {
        if (lastPlacedNode) {
          parentElm.insertBefore(newElm, lastPlacedNode.nextSibling);
        } else {
          parentElm.appendChild(newElm);
        }
      }
      lastPlacedNode = newElm;
    }
  });

  // Remove old children that are no longer present
  oldChildren.forEach((oldChild) => {
    if (oldChild && isVNode(oldChild)) {
      const key = oldChild.$key$;
      if (key != null && !newKeyMap.has(key)) {
        const oldElm = getVNodeElement(oldChild);
        if (oldElm && !isFragment) {
          parentElm.removeChild(oldElm);
        }
      }
    }
  });
}

// Helper function for index-based children reconciliation
function reconcileChildrenByIndex(
  parentElm: HTMLElement,
  oldChildren: (VNode | null)[],
  newChildren: (VNode | null)[],
  perf: ReturnType<typeof createPerformanceTree>,
  isFragment: boolean,
): void {
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
      patch(oldChild, newChild, perf, parentElm);
    }
  }

  // Remove extra old children
  if (oldLen > newLen) {
    const removeName = `${PERF_REMOVE_PREFIX}children`;
    perf.start(removeName);
    for (let i = len; i < oldLen; i++) {
      const child = oldChildren[i];
      if (child && isVNode(child)) {
        const childElement = getVNodeElement(child);
        if (childElement && !isFragment) {
          parentElm.removeChild(childElement);
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
        if (!isFragment) {
          parentElm.appendChild(dom);
        }
        (child as VNode).$elm$ = dom;
      }
    }
  }
}

export function patch(
  oldVNode: VNode | null,
  newVNode: VNode,
  perf: ReturnType<typeof createPerformanceTree>,
  parentElm?: HTMLElement, // Add parent element parameter for fragments
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

  // Handle fragments - they pass through to children management
  if (newVNode.$type$ === NODE_TYPE_FRAGMENT) {
    // For fragments, we treat the fragment's children as if they were the parent's children
    // The parent element will handle the actual DOM operations
    const oldChildren = oldVNode.$children$ || [];
    const newChildren = newVNode.$children$ || [];

    // Use the parent element to manage fragment children
    if (parentElm) {
      // Check if children have keys
      const hasKeys = newChildren.some(
        (child) => child && isVNode(child) && child.$key$ != null,
      );

      if (hasKeys) {
        reconcileChildrenByKey(
          parentElm,
          oldChildren,
          newChildren,
          perf,
          false, // Fragments shouldn't prevent DOM operations
        );
      } else {
        reconcileChildrenByIndex(
          parentElm,
          oldChildren,
          newChildren,
          perf,
          false, // Fragments shouldn't prevent DOM operations
        );
      }
    }

    // Update the fragment VNode
    newVNode.$elm$ = oldVNode.$elm$; // Keep the same DocumentFragment reference
    return newVNode;
  }

  // Update props
  setAttributes(elm as HTMLElement, newVNode.$props$);

  const patchName = `${PERF_UPDATE_PREFIX}${newNodeType}`;
  perf.start(patchName);

  // Update children with proper key-based reconciliation
  const oldChildren = oldVNode.$children$ || [];
  const newChildren = newVNode.$children$ || [];

  // If we have keys, use key-based reconciliation
  const hasKeys = newChildren.some(
    (child) => child && isVNode(child) && child.$key$ != null,
  );

  if (hasKeys) {
    reconcileChildrenByKey(
      elm as HTMLElement,
      oldChildren,
      newChildren,
      perf,
      newVNode.$type$ === NODE_TYPE_FRAGMENT,
    );
  } else {
    // Simple index-based reconciliation for children without keys
    reconcileChildrenByIndex(
      elm as HTMLElement,
      oldChildren,
      newChildren,
      perf,
      newVNode.$type$ === NODE_TYPE_FRAGMENT,
    );
  }

  perf.end(patchName);
  return newVNode;
}
