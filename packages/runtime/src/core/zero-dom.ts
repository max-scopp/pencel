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
 * Intelligently handles setting properties or attributes
 */
export function sp(el: Element, props: Record<string, unknown> | null) {
  if (!props) return;
  for (const k in props) {
    if (k in el) {
      (el as unknown as Record<string, unknown>)[k] = props[k];
    } else {
      el.setAttribute(k, String(props[k]));
    }
  }
}

/**
 * set children (formerly setChildren)
 * Idempotent, handles both single and multiple children
 */
export function sc(
  parent: Element | HTMLElement | DocumentFragment,
  children: (Node | Node[] | string | number | boolean | null | undefined)[],
) {
  // Flatten and filter to only valid Node instances, converting strings to TextNodes
  const flatChildren: Node[] = [];
  const flatten = (
    arr: (Node | Node[] | string | number | boolean | null | undefined)[],
  ): void => {
    for (const child of arr) {
      if (child == null) continue;
      if (Array.isArray(child)) {
        flatten(
          child as (
            | Node
            | Node[]
            | string
            | number
            | boolean
            | null
            | undefined
          )[],
        );
      } else if (typeof child === "string") {
        flatChildren.push(document.createTextNode(child));
      } else if (child instanceof Node) {
        flatChildren.push(child);
      }
    }
  };
  flatten(children);

  const old = parent.childNodes;
  const max = Math.max(old.length, flatChildren.length);
  for (let i = 0; i < max; i++) {
    const w = flatChildren[i];
    const h = old[i];
    if (!w) {
      if (h) parent.removeChild(h);
      continue;
    }
    if (h === w) continue;
    if (h) parent.replaceChild(w, h);
    else parent.appendChild(w);
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
