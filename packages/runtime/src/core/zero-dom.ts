export const cacheLexer = Symbol("_$pen_clex");

export interface CacheOwner {
  [cacheLexer]?: ReturnType<typeof createLexerCache>;
}

export function createLexerCache() {
  const map = new Map<string, unknown>();
  return function once<T>(key: string, factory: () => T): T {
    if (map.has(key)) return map.get(key) as T;
    const v = factory();
    map.set(key, v as unknown);
    return v;
  };
}

export function setProps(el: Element, props: Record<string, any> | null) {
  if (!props) return;
  for (const k in props) {
    const v = props[k];
    if (k === "class" || k === "className") {
      if ((el as HTMLElement).className !== v)
        (el as HTMLElement).className = v;
    } else {
      if (el.getAttribute(k) !== String(v)) el.setAttribute(k, String(v));
    }
  }
}

// helper to set children (idempotent, handles both single and multiple)
export function setChildren(
  parent: HTMLElement | DocumentFragment,
  children: (Node | Node[] | string | null | undefined)[],
) {
  // Flatten and filter to only valid Node instances, converting strings to TextNodes
  const flatChildren: Node[] = [];
  const flatten = (
    arr: (Node | Node[] | string | null | undefined)[],
  ): void => {
    for (const child of arr) {
      if (child == null) continue;
      if (Array.isArray(child)) {
        flatten(child as (Node | Node[] | string | null | undefined)[]);
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

export function setText(node: Text, value: string) {
  if (node.data !== value) node.data = value;
}
