import { createPerformanceTree } from "@pencel/utils";
import { setAttributes } from "../attributes.ts";
import { toVNode } from "../jsx.ts";
import type { JSXElement, VNode } from "../types.ts";
import {
  NODE_TYPE_FRAGMENT,
  NODE_TYPE_HOST,
  NODE_TYPE_TEXT,
} from "../types.ts";
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
      originalChildren?: Node[]; // Store original children for slot projection
    };
  }
  interface ShadowRoot {
    [PENCIL_INTERNALS]?: {
      vnode?: VNode;
    };
  }
}

export type RenderContainer = HTMLElement | ShadowRoot;

/**
 * For non-shadow DOM components, replace <slot> elements with the component's original children
 */
function projectSlots(vnode: VNode, slotContent: VNode[]): VNode {
  if (!vnode) return vnode;

  // If this is a slot element, replace it with the slot content
  if (vnode.$type$ === "slot") {
    // For now, return the first slot content item or a fragment with all content
    if (slotContent.length === 0) {
      // Empty slot - return empty text node
      return {
        $type$: NODE_TYPE_TEXT,
        $props$: {},
        $children$: [],
        $key$: vnode.$key$,
        $elm$: null,
        $text$: "",
      };
    } else if (slotContent.length === 1) {
      // Single item - return it directly
      return { ...slotContent[0], $key$: vnode.$key$ };
    } else {
      // Multiple items - wrap in fragment
      return {
        $type$: NODE_TYPE_FRAGMENT,
        $props$: {},
        $children$: slotContent,
        $key$: vnode.$key$,
        $elm$: null,
      };
    }
  }

  // Recursively process children
  if (vnode.$children$ && vnode.$children$.length > 0) {
    const processedChildren = vnode.$children$.map((child) =>
      child ? projectSlots(child, slotContent) : child,
    );

    return {
      ...vnode,
      $children$: processedChildren,
    };
  }

  return vnode;
}

export function render(jsx: JSXElement, container: RenderContainer): void {
  container[PENCIL_INTERNALS] ??= {};
  const containerInternals = container[PENCIL_INTERNALS];

  let newVNode = toVNode(jsx);

  // Handle slot projection for non-shadow DOM components
  if (container instanceof HTMLElement && !(container instanceof ShadowRoot)) {
    // Check if this component has stored slot content from connectedCallback
    const slotContent = (
      container as HTMLElement & { __pencil_slot_content__?: Node[] }
    ).__pencil_slot_content__;

    if (slotContent && slotContent.length > 0) {
      // Convert stored DOM nodes to VNodes and transform the tree to replace slots
      const slotVNodes = slotContent
        .map((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || "";
            if (text.trim()) {
              return {
                $type$: NODE_TYPE_TEXT,
                $props$: {},
                $children$: [],
                $key$: null,
                $elm$: node as Text,
                $text$: text,
              } as VNode;
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            return {
              $type$: element.tagName.toLowerCase(),
              $props$: {},
              $children$: [], // Could recursively convert children if needed
              $key$: null,
              $elm$: element,
            } as VNode;
          }
          return null;
        })
        .filter((vnode): vnode is VNode => vnode !== null);

      newVNode = projectSlots(newVNode, slotVNodes);

      // Clear the container's children since we'll be rendering new content
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  }

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

    // For Host elements, we need to render their children to the container
    // The Host represents the component itself, but its children should be rendered inside
    if (newVNode.$children$ && newVNode.$children$.length > 0) {
      // Clear the container first
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      // Render each child
      for (const child of newVNode.$children$) {
        if (child) {
          const childElement = createDOM(child, createPerformanceTree());
          container.appendChild(childElement);
        }
      }
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
