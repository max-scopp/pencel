import { setAttributes } from "./attributes.ts";
import type { Props } from "./jsx.ts";
import type { VNode } from "./types.ts";

export function render(
  vnode: VNode,
  container: HTMLElement,
  replaceNode?: HTMLElement | null,
): void {
  const newNode = createDOM(vnode);

  if (replaceNode) {
    container.replaceChild(newNode, replaceNode);
  } else {
    container.appendChild(newNode);
  }

  vnode.$elm$ = newNode;
}

function createDOM(vnode: VNode): HTMLElement | Text {
  if (
    typeof vnode === "string" ||
    typeof vnode === "number" ||
    typeof vnode === "boolean"
  ) {
    return document.createTextNode(String(vnode));
  }

  if (typeof vnode.type === "function") {
    const result = (vnode.type as (props: Props) => VNode)({
      ...vnode.props,
      children: vnode.children,
    });
    return createDOM(result);
  }

  const element = document.createElement(vnode.type as string);

  // Set attributes and properties
  setAttributes(element, vnode.props);

  // Create and append children
  vnode.children?.forEach((child) => {
    if (child != null) {
      element.appendChild(createDOM(child as VNode));
    }
  });

  return element;
}

export function patch(oldVNode: VNode | null, newVNode: VNode): VNode {
  // If old node doesn't exist, create new DOM
  if (!oldVNode) {
    const newNode = createDOM(newVNode);
    newVNode.$elm$ = newNode;
    return newVNode;
  }

  // If nodes are the same reference, no change needed
  if (oldVNode === newVNode) {
    return newVNode;
  }

  // If nodes are different types, replace completely
  if (oldVNode.type !== newVNode.type) {
    const newNode = createDOM(newVNode);
    if (oldVNode.$elm$?.parentNode) {
      oldVNode.$elm$.parentNode.replaceChild(newNode, oldVNode.$elm$);
    }
    newVNode.$elm$ = newNode;
    return newVNode;
  }

  // Update existing node
  const elm = (newVNode.$elm$ = oldVNode.$elm$);
  if (!elm) return newVNode;

  // Update props
  setAttributes(elm as HTMLElement, newVNode.props);

  // Update children
  patchChildren(oldVNode.children, newVNode.children, elm as HTMLElement);

  return newVNode;
}

function patchChildren(
  oldChildren: Array<VNode | string | number | boolean | null>,
  newChildren: Array<VNode | string | number | boolean | null>,
  parentElm: HTMLElement,
): void {
  const oldLen = oldChildren.length;
  const newLen = newChildren.length;
  const len = Math.min(oldLen, newLen);

  // Update existing children
  for (let i = 0; i < len; i++) {
    const oldChild = oldChildren[i];
    const newChild = newChildren[i];

    if (oldChild != null && newChild != null) {
      patch(oldChild as VNode, newChild as VNode);
    }
  }

  // Remove extra old children
  if (oldLen > newLen) {
    for (let i = len; i < oldLen; i++) {
      const child = oldChildren[i];
      if (child && "elm" in child && child.elm) {
        parentElm.removeChild(child.elm);
      }
    }
  }

  // Add new children
  if (newLen > oldLen) {
    for (let i = len; i < newLen; i++) {
      const child = newChildren[i];
      if (child != null) {
        parentElm.appendChild(createDOM(child as VNode));
      }
    }
  }
}
