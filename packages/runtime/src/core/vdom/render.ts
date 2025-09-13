import { createPerformanceTree } from "@pencil/utils";
import { setAttributes } from "../attributes.ts";
import { toVNode } from "../jsx.ts";
import type { JSXElement, VNode } from "../types.ts";
import { NODE_TYPE_FRAGMENT, NODE_TYPE_HOST } from "../types.ts";
import { createDOM } from "./create-dom.ts";
import { patch } from "./patch.ts";

// Node types

// Internal storage key
const PENCIL_INTERNALS: unique symbol = Symbol("__$pencil_internals$");

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

export type RenderContainer = HTMLElement | ShadowRoot;

export function render(jsx: JSXElement, container: RenderContainer): void {
  container[PENCIL_INTERNALS] ??= {};
  const containerInternals = container[PENCIL_INTERNALS];

  const newVNode = toVNode(jsx);

  // Special handling for Host element - it should update the host element directly
  if (newVNode.$type$ === NODE_TYPE_HOST) {
    // Host element should always apply attributes to the component element itself,
    // not to the shadow root. We need to find the actual HTMLElement that owns this container.
    let hostElement: HTMLElement;

    if (container instanceof HTMLElement) {
      // Container is the component element itself
      hostElement = container;
    } else if (container instanceof ShadowRoot) {
      // Container is a shadow root, get its host element
      hostElement = container.host as HTMLElement;
    } else {
      throw new Error("Invalid container type for Host element");
    }

    newVNode.$elm$ = hostElement;

    // Apply Host props to the host element
    if (newVNode.$props$) {
      setAttributes(hostElement, newVNode.$props$);
    }
    // Store the Host VNode for future renders
    containerInternals.vnode = newVNode;
    return;
  }

  // Get the previously rendered VNode from the container
  const oldVNode = containerInternals.vnode;

  const renderPerf = createPerformanceTree();

  renderPerf.start("render");

  if (oldVNode) {
    // Update existing content using patch
    const updatedVNode = patch(
      oldVNode,
      newVNode,
      renderPerf,
      container as HTMLElement,
    );

    // Store the updated VNode for future renders
    containerInternals.vnode = updatedVNode;
  } else {
    // First render - create new DOM
    if (newVNode.$type$ === NODE_TYPE_FRAGMENT) {
      // For fragments, render children directly to container
      if (newVNode.$children$) {
        for (const child of newVNode.$children$) {
          if (child) {
            const childNode = createDOM(child, renderPerf);
            container.appendChild(childNode);
          }
        }
      }
      // Store the fragment VNode but it doesn't have a real DOM element
      newVNode.$elm$ = null;
    } else {
      const newNode = createDOM(newVNode, renderPerf);
      container.appendChild(newNode);
    }

    // Store the VNode for future renders
    containerInternals.vnode = newVNode;
  }

  // Only log if this is not part of a batch (i.e., standalone render)
  renderPerf.end("render");
  renderPerf.log();
}
