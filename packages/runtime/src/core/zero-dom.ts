export const cacheSymbol = Symbol("_$pen_cmc");

export interface CacheOwner {
  [cacheSymbol]?: ReturnType<typeof mc>;
}

/**
 * mc - memoization cache (create memo cache)
 * Returns a memoization function that caches by key
 */
export function mc() {
  const map = new Map<string, unknown>();
  return function once<T>(key: string, factory: () => T): T {
    if (map.has(key)) return map.get(key) as T;
    const v = factory();
    map.set(key, v as unknown);
    return v;
  };
}

/**
 * set properties (formerly setProps)
 * Intelligently handles setting properties or attributes.
 */
export function sp(el: Element, props: Record<string, unknown> | null) {
  if (!props) return;

  for (const k in props) {
    const v = props[k];

    switch (k) {
      case "style": {
        const styleObj = v as Record<string, string>;
        const style = (el as HTMLElement).style as unknown as Record<
          string,
          string
        >;

        for (const styleKey in styleObj) {
          const styleValue = styleObj[styleKey];
          const current = style[styleKey];
          if (current !== styleValue) {
            style[styleKey] = styleValue;
          }
        }
        break;
      }
      default: {
        if (k in el) {
          const current = (el as unknown as Record<string, unknown>)[k];
          if (current !== v) {
            (el as unknown as Record<string, unknown>)[k] = v;
          }
        } else {
          const strValue = String(v);
          const current = el.getAttribute(k);
          if (current !== strValue) {
            el.setAttribute(k, strValue);
          }
        }
      }
    }
  }
}

/**
 * set children (formerly setChildren)
 * Simple reconciliation without any batching or scheduling
 * - Reuses stable nodes that haven't changed
 * - Applies mutations immediately as-is
 */
export function sc(
  parent: Element | HTMLElement | DocumentFragment,
  children: (Node | Node[] | string | number | boolean | null | undefined)[],
) {
  // Flatten children array
  const flatChildren: Node[] = [];
  const flatten = (
    arr: (Node | Node[] | string | number | boolean | null | undefined)[],
  ): void => {
    for (const child of arr) {
      if (child == null) continue;
      if (Array.isArray(child)) {
        flatten(child);
      } else if (typeof child === "string" || typeof child === "number") {
        flatChildren.push(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        flatChildren.push(child);
      }
    }
  };
  flatten(children);

  const old = parent.childNodes;
  const max = Math.max(old.length, flatChildren.length);

  // Reconcile and apply mutations immediately
  for (let i = 0; i < max; i++) {
    const w = flatChildren[i];
    const h = old[i];

    if (!w) {
      // Remove extra old nodes
      if (h) parent.removeChild(h);
      continue;
    }

    if (h === w) {
      // Node is already in place, skip
      continue;
    }

    if (!h) {
      // Append new node
      parent.appendChild(w);
      continue;
    }

    // Check if nodes are semantically equivalent and can be reused
    const canReuse =
      h.nodeType === w.nodeType &&
      (h.nodeType === Node.TEXT_NODE
        ? (h as Text).data === (w as Text).data
        : h.nodeName === w.nodeName);

    if (canReuse) {
      // Reuse node, update text if needed
      if (h.nodeType === Node.TEXT_NODE) {
        (h as Text).data = (w as Text).data;
      }
      continue;
    }

    // Replace node only when types differ
    parent.replaceChild(w, h);
  }
}

/**
 * set text (formerly setText)
 * Updates text node data if changed
 */
export function st(node: Text, value: string) {
  if (node.data !== value) node.data = value;
}

/**
 * document.createElement
 */
export const dce = (tag: string): Element => document.createElement(tag);

/**
 * document.createTextNode
 */
export const dctn = (text: string): Text => document.createTextNode(text);

/**
 * addEventListener
 */
export const ael = (el: Element, event: string, handler: EventListener): void =>
  el.addEventListener(event, handler);
