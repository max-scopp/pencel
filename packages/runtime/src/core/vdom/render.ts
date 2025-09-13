import { createPerformanceTree } from "@pencil/utils";
import { toVNode } from "../jsx.ts";
import { createDOM } from "./create-dom.ts";
import { patch } from "./patch.ts";
import type { JSXElement, VNode } from "./types.ts";

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

  // Get the previously rendered VNode from the container
  const oldVNode = containerInternals.vnode;

  const renderPerf = createPerformanceTree();

  renderPerf.start("render");

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
  renderPerf.end("render");
  renderPerf.log();
}
