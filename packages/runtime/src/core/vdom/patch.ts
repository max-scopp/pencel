import { type createPerformanceTree, throwConsumerError } from "@pencel/utils";
import { getVNodeElement } from "src/utils/getVNodeElement.ts";
import { isVNode } from "src/utils/isVNode.ts";
import { setAttributes } from "../attributes.ts";
import { createDOM } from "./create-dom.ts";
import {
  NODE_TYPE_FRAGMENT,
  NODE_TYPE_HOST,
  NODE_TYPE_TEXT,
  type VNode,
} from "./types.ts";

const PERF_UPDATE_PREFIX = "update-";
const PERF_REMOVE_PREFIX = "remove-";

// Helper function for key-based children reconciliation
function reconcileChildrenByKey(
  parentElm: HTMLElement,
  oldChildren: (VNode | null)[],
  newChildren: (VNode | null)[],
  perf: ReturnType<typeof createPerformanceTree>,
): void {
  const oldKeyMap = new Map<string | number, VNode>();
  const newKeyMap = new Map<string | number, VNode>();

  // Flatten children to handle fragments
  const flattenChildren = (children: (VNode | null)[]): (VNode | null)[] => {
    const flattened: (VNode | null)[] = [];
    for (const child of children) {
      if (child && isVNode(child) && child.$type$ === NODE_TYPE_FRAGMENT) {
        if (child.$children$) {
          flattened.push(...flattenChildren(child.$children$));
        }
      } else {
        flattened.push(child);
      }
    }
    return flattened;
  };

  const flatOldChildren = flattenChildren(oldChildren);
  const flatNewChildren = flattenChildren(newChildren);

  // Build maps of keyed children
  flatOldChildren.forEach((child) => {
    if (child && isVNode(child) && child.$key$ != null) {
      oldKeyMap.set(child.$key$, child);
    }
  });

  flatNewChildren.forEach((child) => {
    if (child && isVNode(child) && child.$key$ != null) {
      newKeyMap.set(child.$key$, child);
    }
  });

  // Process new children
  let lastPlacedNode: Node | null = null;

  flatNewChildren.forEach((newChild) => {
    if (!newChild || !isVNode(newChild)) return;

    const key = newChild.$key$;
    const oldChild = key != null ? oldKeyMap.get(key) : null;

    if (oldChild) {
      // Child exists, patch it
      patch(oldChild, newChild, perf, parentElm);

      // Move to correct position if needed
      const oldElm = getVNodeElement(oldChild);
      if (oldElm && lastPlacedNode && oldElm !== lastPlacedNode.nextSibling) {
        parentElm.insertBefore(oldElm, lastPlacedNode.nextSibling);
      }
      lastPlacedNode = oldElm;
    } else {
      // New child, create it
      const newElm = createDOM(newChild, perf);
      newChild.$elm$ = newElm;
      if (lastPlacedNode) {
        parentElm.insertBefore(newElm, lastPlacedNode.nextSibling);
      } else {
        parentElm.appendChild(newElm);
      }
      lastPlacedNode = newElm;
    }
  });

  // Remove old children that are no longer present
  flatOldChildren.forEach((oldChild) => {
    if (oldChild && isVNode(oldChild)) {
      const key = oldChild.$key$;
      if (key != null && !newKeyMap.has(key)) {
        const oldElm = getVNodeElement(oldChild);
        if (oldElm && oldElm.parentNode === parentElm) {
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
): void {
  // Flatten children to handle fragments
  const flattenChildren = (children: (VNode | null)[]): (VNode | null)[] => {
    const flattened: (VNode | null)[] = [];
    for (const child of children) {
      if (child && isVNode(child) && child.$type$ === NODE_TYPE_FRAGMENT) {
        if (child.$children$) {
          flattened.push(...flattenChildren(child.$children$));
        }
      } else {
        flattened.push(child);
      }
    }
    return flattened;
  };

  const flatOldChildren = flattenChildren(oldChildren);
  const flatNewChildren = flattenChildren(newChildren);

  const oldLen = flatOldChildren.length;
  const newLen = flatNewChildren.length;
  const len = Math.min(oldLen, newLen);

  // Update existing children
  for (let i = 0; i < len; i++) {
    const oldChild = flatOldChildren[i];
    const newChild = flatNewChildren[i];

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
      const child = flatOldChildren[i];
      if (child && isVNode(child)) {
        const childElement = getVNodeElement(child);
        if (childElement && childElement.parentNode === parentElm) {
          parentElm.removeChild(childElement);
        }
      }
    }
    perf.end(removeName);
  }

  // Add new children
  if (newLen > oldLen) {
    for (let i = len; i < newLen; i++) {
      const child = flatNewChildren[i];
      if (child != null) {
        const dom = createDOM(child as VNode, perf);
        parentElm.appendChild(dom);
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

  // Special handling for Host element - it should update the parent container directly
  if (newVNode.$type$ === NODE_TYPE_HOST) {
    if (!parentElm) {
      throwConsumerError(
        "Host element must be used within a component render context",
      );
    }

    // Host element updates the parent container directly
    newVNode.$elm$ = parentElm;

    // Apply Host props to the parent container
    if (newVNode.$props$) {
      setAttributes(parentElm, newVNode.$props$);
    }

    // Handle Host children by patching them against the parent
    const oldChildren = oldVNode?.$children$ || [];
    const newChildren = newVNode.$children$ || [];

    reconcileChildrenByIndex(parentElm, oldChildren, newChildren, perf);

    return newVNode;
  }

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

  // Handle fragments - they are virtual containers that don't create DOM nodes
  if (newVNode.$type$ === NODE_TYPE_FRAGMENT) {
    // For fragments, we don't create a DOM node - we just manage children
    // The fragment VNode doesn't have an $elm$ property set to any real DOM node
    newVNode.$elm$ = null;

    const oldChildren = oldVNode?.$children$ || [];
    const newChildren = newVNode.$children$ || [];

    // Use the parent element to manage fragment children
    if (parentElm) {
      // Check if children have keys
      const hasKeys = newChildren.some(
        (child) => child && isVNode(child) && child.$key$ != null,
      );

      if (hasKeys) {
        reconcileChildrenByKey(parentElm, oldChildren, newChildren, perf);
      } else {
        reconcileChildrenByIndex(parentElm, oldChildren, newChildren, perf);
      }
    }

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
    reconcileChildrenByKey(elm as HTMLElement, oldChildren, newChildren, perf);
  } else {
    // Simple index-based reconciliation for children without keys
    reconcileChildrenByIndex(
      elm as HTMLElement,
      oldChildren,
      newChildren,
      perf,
    );
  }

  perf.end(patchName);
  return newVNode;
}
