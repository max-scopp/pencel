import { createPerformanceTree } from "@pencil/utils";
import { setAttributes } from "./attributes.ts";
import { toVNode } from "./jsx.ts";
import type { JSXElement, VNode } from "./types.ts";

// Constants for performance tracking
const PERF_RENDER_BATCH = "render-batch";
const PERF_CREATE_PREFIX = "create-";
const PERF_UPDATE_PREFIX = "update-";
const PERF_REMOVE_PREFIX = "remove-";

// Node types
const NODE_TYPE_TEXT = "TEXT";
const NODE_TYPE_COMMENT = "COMMENT";

// Internal storage key
const PENCIL_INTERNALS = "__$pencil_internals$";

// Type guards and helper functions
function getContainerInternals(container: RenderContainer): { vnode?: VNode } {
  const internals = (container as { [PENCIL_INTERNALS]?: { vnode?: VNode } })[
    PENCIL_INTERNALS
  ];
  if (!internals) {
    (container as { [PENCIL_INTERNALS]: { vnode?: VNode } })[PENCIL_INTERNALS] =
      { vnode: undefined };
  }
  return (container as { [PENCIL_INTERNALS]: { vnode?: VNode } })[
    PENCIL_INTERNALS
  ];
}

function isVNode(value: unknown): value is VNode {
  return value !== null && typeof value === "object" && "$type$" in value;
}

function getVNodeElement(vnode: VNode): Node | null {
  return vnode.$elm$ || null;
}

// Extend HTMLElement and ShadowRoot to include our internal storage
declare global {
  interface HTMLElement {
    [PENCIL_INTERNALS]?: {
      vnode?: VNode;
    };
  }
  interface ShadowRoot {
    [PENCIL_INTERNALS]?: {
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
  private batchPerf: ReturnType<typeof createPerformanceTree> | null = null;

  scheduleComponentUpdate(component: HTMLElement, renderFn: () => void) {
    this.pendingUpdates.add(component);
    this.pendingRenders.add(renderFn);

    if (!this.isFlushingUpdates) {
      // Start performance timing when component update is scheduled (before microtask)
      if (!this.batchPerf) {
        this.batchPerf = createPerformanceTree();
        this.batchPerf.start(PERF_RENDER_BATCH);
      }

      // Use microtask for immediate scheduling
      queueMicrotask(() => this.flushUpdates());
    }
  }

  scheduleRender(renderFn: () => void) {
    this.pendingRenders.add(renderFn);

    if (!this.isFlushingUpdates) {
      // Start performance timing when render is scheduled (before requestAnimationFrame)
      if (!this.batchPerf) {
        this.batchPerf = createPerformanceTree();
        this.batchPerf.start(PERF_RENDER_BATCH);
      }

      requestAnimationFrame(() => this.flushUpdates());
    }
  }

  getBatchPerf(): ReturnType<typeof createPerformanceTree> {
    if (!this.batchPerf) {
      this.batchPerf = createPerformanceTree();
    }
    return this.batchPerf;
  }

  private flushUpdates() {
    if (this.isFlushingUpdates) return;

    this.isFlushingUpdates = true;

    // Performance tree is already started in scheduleRender
    // Just ensure we have a batchPerf instance
    if (!this.batchPerf) {
      this.batchPerf = createPerformanceTree();
      this.batchPerf.start(PERF_RENDER_BATCH);
    }

    try {
      // Execute all queued renders in one big batch
      for (const render of this.pendingRenders) {
        render();
      }
    } finally {
      this.batchPerf.end(PERF_RENDER_BATCH);
      this.batchPerf.log();

      this.batchPerf = null;
      this.pendingUpdates.clear();
      this.pendingRenders.clear();
      this.isFlushingUpdates = false;
    }
  }
}

const scheduler = new ComponentUpdateScheduler();

// Export function for components to schedule updates
export function scheduleComponentUpdate(
  component: HTMLElement,
  renderFn: () => void,
): void {
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
  const containerInternals = getContainerInternals(container);

  const newVNode = toVNode(jsx);

  // Get the previously rendered VNode from the container
  const oldVNode = containerInternals.vnode;

  // Check if we're in a batch operation
  const isInBatch = scheduler.getBatchPerf() !== null;
  const renderPerf = isInBatch
    ? scheduler.getBatchPerf()
    : createPerformanceTree();

  if (!isInBatch) {
    renderPerf.start("render");
  }

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

  // Only log if this is not part of a batch (i.e., standalone render)
  if (!isInBatch) {
    renderPerf.end("render");
    renderPerf.log();
  }
}

function createDOM(
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
