import { createPerformanceTree } from "@pencil/utils";
import { setAttributes } from "./attributes.ts";
import { toVNode } from "./jsx.ts";
import type { JSXElement, VNode } from "./types.ts";

// Extend HTMLElement and ShadowRoot to include our internal storage
declare global {
  interface HTMLElement {
    __$pencil_internals$?: {
      vnode?: VNode;
    };
  }
  interface ShadowRoot {
    __$pencil_internals$?: {
      vnode?: VNode;
    };
  }
}

type RenderContainer = HTMLElement | ShadowRoot;

// Component update scheduler integrated with render system
class ComponentUpdateScheduler {
  private pendingUpdates = new Set<HTMLElement>();
  private pendingRenders = new Set<() => void>();
  private isFlushingUpdates = false;

  scheduleComponentUpdate(component: HTMLElement, renderFn: () => void) {
    this.pendingUpdates.add(component);
    this.pendingRenders.add(renderFn);

    if (!this.isFlushingUpdates) {
      // Use microtask for immediate scheduling
      queueMicrotask(() => this.flushUpdates());
    }
  }

  scheduleRender(renderFn: () => void) {
    this.pendingRenders.add(renderFn);

    if (!this.isFlushingUpdates) {
      requestAnimationFrame(() => this.flushUpdates());
    }
  }

  private flushUpdates() {
    if (this.isFlushingUpdates) return;

    this.isFlushingUpdates = true;

    // Create a new performance tree for this entire batch
    const renderPerf = createPerformanceTree();
    renderPerf.start("render-batch");

    // Execute all queued renders in one big batch
    for (const render of this.pendingRenders) {
      render();
    }

    renderPerf.end("render-batch");
    renderPerf.log();

    this.pendingUpdates.clear();
    this.pendingRenders.clear();
    this.isFlushingUpdates = false;
  }
}

const scheduler = new ComponentUpdateScheduler();

// Export function for components to schedule updates
export function scheduleComponentUpdate(
  component: HTMLElement,
  renderFn: () => void,
) {
  scheduler.scheduleComponentUpdate(component, renderFn);
}

function scheduleRender(renderFn: () => void) {
  scheduler.scheduleRender(renderFn);
}
export function render(jsx: JSXElement, container: RenderContainer): void {
  scheduleRender(() => {
    performRender(jsx, container);
  });
}

function performRender(jsx: JSXElement, container: RenderContainer): void {
  const internals = (container as { __$pencil_internals$?: { vnode?: VNode } })
    .__$pencil_internals$;
  if (!internals) {
    (
      container as { __$pencil_internals$: { vnode?: VNode } }
    ).__$pencil_internals$ = { vnode: undefined };
  }
  const containerInternals = (
    container as { __$pencil_internals$: { vnode?: VNode } }
  ).__$pencil_internals$;

  const newVNode = toVNode(jsx);

  // Get the previously rendered VNode from the container
  const oldVNode = containerInternals.vnode;

  // Create a performance tree for this specific render
  const renderPerf = createPerformanceTree();

  if (oldVNode) {
    // Update existing content using patch
    const updatedVNode = patch(oldVNode, newVNode, renderPerf);

    // Store the updated VNode for future renders
    containerInternals.vnode = updatedVNode;
  } else {
    // First render - create new DOM
    const newNode = createDOM(newVNode, renderPerf);

    container.appendChild(newNode);

    // Store the VNode for future renders
    containerInternals.vnode = newVNode;
  }
}

function createDOM(
  vnode: VNode,
  perf: ReturnType<typeof createPerformanceTree>,
): HTMLElement | Text | Comment {
  const nodeType = String(vnode.$type$);
  perf.start(`🔨 create-${nodeType}`);

  if (vnode.$type$ === "COMMENT") {
    const comment = document.createComment(vnode.$text$ || "");
    vnode.$elm$ = comment;
    perf.end(`🔨 create-${nodeType}`);
    return comment;
  }

  if (vnode.$type$ === "TEXT") {
    const text = document.createTextNode(vnode.$text$ || "");
    vnode.$elm$ = text;
    perf.end(`🔨 create-${nodeType}`);
    return text;
  }

  if (
    typeof vnode === "string" ||
    typeof vnode === "number" ||
    typeof vnode === "boolean"
  ) {
    const result = document.createTextNode(String(vnode));
    perf.end(`🔨 create-${(vnode as VNode).$type$}`);
    return result;
  }

  const element = document.createElement(String(vnode.$type$));

  // Set attributes and properties
  setAttributes(element, vnode.$props$);

  // Create all children at once
  if (vnode.$children$ && vnode.$children$.length > 0) {
    for (const child of vnode.$children$) {
      if (child != null) {
        const childElement = createDOM(child as VNode, perf);
        element.appendChild(childElement);
      }
    }
  }

  vnode.$elm$ = element;
  perf.end(`🔨 create-${nodeType}`);
  return element;
}

function patch(
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

  const patchName = `🔧 update-${newNodeType}`;
  perf.start(patchName);

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

    if (oldChild != null && newChild != null) {
      patch(oldChild as VNode, newChild as VNode, perf);
    }
  }

  // Remove extra old children
  if (oldLen > newLen) {
    const removeName = `🗑️ remove-${newNodeType}-children`;
    perf.start(removeName);
    for (let i = len; i < oldLen; i++) {
      const child = oldChildren[i];
      if (child && typeof child === "object" && "$elm" in child && child.$elm) {
        (elm as HTMLElement).removeChild(child.$elm as Node);
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
