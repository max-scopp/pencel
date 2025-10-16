import { createPerformanceTree } from "@pencel/utils";
import type { Props } from "../jsx/types.ts";
import { type VNode, VNodeKind } from "./types.ts";

const vnodePerf = createPerformanceTree("Render");

// Node shape that carries a __vnode back-reference for diffing
type NodeWithVNode = Node & { __vnode?: VNode };

/**
 * Render a VNode (or array of VNodes) into a container.
 * Handles first render and updates efficiently.
 */
export function renderVNode(
  vnode: JSX.Element | null,
  container: Element | ShadowRoot,
): Node | null {
  vnodePerf.start("total");
  const node = _renderVNode(vnode, container);
  console.dir(vnode, {
    depth: 0,
  });
  vnodePerf.end("total");
  vnodePerf.log();
  return node;
}

export function _renderVNode(
  vnode: JSX.Element | null,
  container: Element | ShadowRoot,
): Node | null {
  if (!vnode) return null;

  vnodePerf.start(`VNode-${vnode.k}-${vnode.i ?? "nokey"}`);

  switch (vnode.k) {
    case VNodeKind.Text: {
      const text = vnode.text;
      if (vnode.el) {
        if ((vnode.el as Text).nodeValue !== text)
          (vnode.el as Text).nodeValue = text;
      } else {
        vnode.el = document.createTextNode(text);
        // attach back-reference for future diffs
        (vnode.el as NodeWithVNode).__vnode = vnode;
        container.appendChild(vnode.el);
      }
      break;
    }

    case VNodeKind.Comment: {
      const text = vnode.text;
      if (vnode.el) {
        vnode.el.nodeValue = text;
      } else {
        vnode.el = document.createComment(text);
        (vnode.el as NodeWithVNode).__vnode = vnode;
        container.appendChild(vnode.el);
      }
      break;
    }

    case VNodeKind.Fragment: {
      vnode.c?.forEach((child) => {
        _renderVNode(child, container);
      });
      break;
    }

    case VNodeKind.Tag: {
      if (!vnode.el) {
        // Try to reuse a single existing child element when possible (simple root reuse)
        if (container && container.childNodes.length === 1) {
          const first = container.childNodes[0];
          if (
            first.nodeType === Node.ELEMENT_NODE &&
            (first as Element).tagName.toLowerCase() === vnode.tag
          ) {
            vnode.el = first as Element;
          }
        }

        if (!vnode.el) {
          vnode.el = document.createElement(vnode.tag);
          container.appendChild(vnode.el);
        }
        // attach back-reference for future diffs
        (vnode.el as NodeWithVNode).__vnode = vnode;
      } else {
        // ensure back-reference is current
        (vnode.el as NodeWithVNode).__vnode = vnode;
      }

      applyElementProps(vnode.el, vnode.p ?? {}, vnode.olp ?? {});
      vnode.olp = vnode.p;

      // Reconcile children into the element itself
      reconcileChildren(vnode.c ?? [], vnode.el);

      // Render children into the element (not the parent container)
      vnode.c?.forEach((child) => {
        _renderVNode(child, vnode.el as Element);
      });
      break;
    }

    case VNodeKind.Host: {
      applyElementProps(
        container instanceof ShadowRoot ? container.host : container,
        vnode.p ?? {},
        vnode.olp ?? {},
      );
      vnode.olp = vnode.p;

      // Host children should be reconciled into the actual container (host),
      // not into vnode.el which may be undefined.
      reconcileChildren(vnode.c ?? [], container);
      break;
    }

    case VNodeKind.Component: {
      // TODO: Question args
      const rendered = vnode.f.call(container, {
        ...(vnode.p ?? {}),
        children: vnode.c ?? [],
      });

      vnode.el = _renderVNode(rendered as VNode, container) as Element | null;
      if (vnode.el) (vnode.el as NodeWithVNode).__vnode = vnode;
      break;
    }
  }

  vnodePerf.end(`VNode-${vnode.k}-${vnode.i ?? "nokey"}`);
  return "el" in vnode && vnode.el ? vnode.el : null;
}

const VNODE_REF = Symbol("vnode_ref");

/** typed helpers to get/set vnode reference on DOM nodes */
function getVNodeRef(node: Node): VNode | undefined {
  return (node as unknown as { [VNODE_REF]?: VNode })[VNODE_REF];
}

function setVNodeRef(node: Node, vnode: VNode | undefined): void {
  (node as unknown as { [VNODE_REF]?: VNode })[VNODE_REF] = vnode;
}

/**
 * Reconcile a list of child VNodes into `container`.
 * - creates new DOM nodes (via _renderVNode) when needed
 * - reuses and moves existing DOM nodes when possible (keys or order)
 * - removes leftover DOM nodes that aren't reused
 */
export function reconcileChildren(
  children: Array<VNode | null>,
  container: Element | ShadowRoot,
): void {
  // snapshot of current DOM children
  const existingNodes = Array.from(container.childNodes);

  // build keyed map & unkeyed queue from existing DOM children
  const existingKeyed = new Map<string | number, Node>();
  const existingUnkeyed: Node[] = [];

  for (const node of existingNodes) {
    const associated = getVNodeRef(node);
    if (associated && associated.i != null) {
      existingKeyed.set(associated.i, node);
    } else {
      existingUnkeyed.push(node);
    }
  }

  // ----- SLOT HANDLING (collect slot nodes and assign content) -----
  const slotNodes: Record<string, VNode> = {};
  const slotContent: Record<string, VNode[]> = {};

  for (const ch of children) {
    if (!ch) continue;
    if (ch.k === VNodeKind.Tag && ch.tag === "slot") {
      const name = ch.p && typeof ch.p.name === "string" ? ch.p.name : "";
      slotNodes[name] = ch;
    } else if (
      ch.k === VNodeKind.Tag &&
      ch.p &&
      typeof ch.p.slot === "string"
    ) {
      const name = ch.p.slot;
      slotContent[name] = slotContent[name] || [];
      slotContent[name].push(ch);
    } else {
      slotContent[""] = slotContent[""] || [];
      slotContent[""].push(ch);
    }
  }

  // render slot content into the container where slots appear
  for (const [name, slotVNode] of Object.entries(slotNodes)) {
    const content = slotContent[name] ?? slotVNode.c ?? [];
    reconcileChildren(content, container);
  }

  // fallback: if slot exists but no content, render slot fallback
  for (const [name, slotVNode] of Object.entries(slotNodes)) {
    if (!(name in slotContent) || slotContent[name].length === 0) {
      reconcileChildren(slotVNode.c ?? [], container);
    }
  }

  // ----- MAIN DIFF: place/create/update children in order -----
  // We'll iterate desired children and ensure the DOM nodes at the same indices match
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    // the DOM node that should sit at position `i` after reconciliation
    const referenceNode = container.childNodes[i] ?? null;

    if (!child) {
      // desired child is null → nothing to render at this position
      // we'll handle removals of leftovers at the end
      continue;
    }

    if (child.i != null) {
      // keyed child: try to find existing keyed DOM node
      const existingNode = existingKeyed.get(child.i);
      if (existingNode) {
        // move it into position if necessary
        if (referenceNode !== existingNode) {
          container.insertBefore(existingNode, referenceNode);
        }

        // bind DOM <-> VNode
        setVNodeRef(existingNode, child);
        child.el = existingNode as Element | Text;

        // update the VNode into the container (it will reuse child.el)
        _renderVNode(child, container);

        // mark consumed
        existingKeyed.delete(child.i);
        continue;
      }

      // not found: create new node and insert it at position
      const created = _renderVNode(child, container);
      if (created) {
        // ensure correct position
        if (referenceNode && created !== referenceNode)
          container.insertBefore(created, referenceNode);
        setVNodeRef(created, child);
        child.el = created as Element | Text;
      }
      continue;
    }

    // unkeyed child -- try to reuse next existing unkeyed DOM node
    const reuse = existingUnkeyed.shift();
    if (reuse) {
      // place it at the correct index
      if (referenceNode !== reuse) container.insertBefore(reuse, referenceNode);

      // bind DOM <-> VNode
      setVNodeRef(reuse, child);
      child.el = reuse as Element | Text;

      // update in-place
      _renderVNode(child, container);
      continue;
    }

    // no unkeyed DOM node to reuse -> create new
    const created = _renderVNode(child, container);
    if (created) {
      if (referenceNode && created !== referenceNode)
        container.insertBefore(created, referenceNode);
      setVNodeRef(created, child);
      child.el = created as Element | Text;
    }
  }

  // ----- CLEANUP: remove remaining old nodes that weren't reused -----
  // remove keyed leftovers
  for (const leftover of existingKeyed.values()) {
    if (leftover.parentNode === container) container.removeChild(leftover);
  }

  // remove unconsumed unkeyed leftovers
  for (const leftover of existingUnkeyed) {
    if (leftover.parentNode === container) container.removeChild(leftover);
  }

  // ensure no extra nodes beyond new children length
  // (if reconciliation left more nodes at the end, remove them)
  while (container.childNodes.length > children.length) {
    const removeNode = container.childNodes[container.childNodes.length - 1];
    if (removeNode.parentNode === container) container.removeChild(removeNode);
  }
}

const LISTENERS = Symbol("vnode_listeners");

function applyClassProps(el: Element, newProps: Props) {
  if ("className" in newProps) {
    el.className = String(newProps.className ?? "");
  } else if ("class" in newProps) {
    el.setAttribute("class", String(newProps.class ?? ""));
  }
}

function applyStyleProps(el: Element, newProps: Props) {
  if (
    "style" in newProps &&
    typeof newProps.style === "object" &&
    newProps.style !== null
  ) {
    for (const [k, v] of Object.entries(newProps.style)) {
      // style is a CSSStyleDeclaration; cast via unknown to avoid `any`
      ((el as HTMLElement).style as unknown as Record<string, unknown>)[k] = v;
    }
  } else if ("style" in newProps && typeof newProps.style === "string") {
    el.setAttribute("style", newProps.style);
  }
}

function applyBooleanAttribute(el: Element, key: string, value: boolean) {
  if (value) el.setAttribute(key, "");
  else el.removeAttribute(key);
}

export function applyElementProps(
  el: Element,
  newProps: Props = {},
  oldProps: Props = {},
): void {
  // Track current event listeners on element
  const existingListeners: Record<string, EventListener> =
    (el as HTMLElement & { [LISTENERS]?: Record<string, EventListener> })[
      LISTENERS
    ] ?? {};
  const newListeners: Record<string, EventListener> = {};

  // 1 Remove old attributes no longer in newProps
  for (const key of Object.keys(oldProps)) {
    if (key === "children") continue;
    if (!(key in newProps) && !key.startsWith("on")) {
      el.removeAttribute(key);
    }
  }

  // 2 Apply class and style props first
  applyClassProps(el, newProps);
  applyStyleProps(el, newProps);

  // 3 Apply other props
  for (const [key, value] of Object.entries(newProps)) {
    if (
      key === "children" ||
      key === "class" ||
      key === "className" ||
      key === "style"
    )
      continue;

    // Event listeners
    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.slice(2).toLowerCase();
      const old = existingListeners[eventName];
      if (old) el.removeEventListener(eventName, old);

      el.addEventListener(eventName, value as EventListener);
      newListeners[eventName] = value as EventListener;
      continue;
    }

    // Boolean attributes
    if (typeof value === "boolean") {
      applyBooleanAttribute(el, key, value);
      continue;
    }

    // Attempt to assign directly to element property if it exists
    if (key in el) {
      try {
        (el as unknown as Record<string, unknown>)[key] = value;
        continue;
      } catch {
        // fallback to attribute if property assignment fails
      }
    }

    // Fallback: set as attribute if primitive
    if (typeof value === "string" || typeof value === "number") {
      el.setAttribute(key, String(value));
    }
  }

  // 4 Remove old event listeners not present anymore
  for (const eventName of Object.keys(existingListeners)) {
    if (!(eventName in newListeners)) {
      el.removeEventListener(eventName, existingListeners[eventName]);
    }
  }

  // Save current listeners for next diff
  (el as HTMLElement & { [LISTENERS]?: Record<string, EventListener> })[
    LISTENERS
  ] = newListeners;
}
