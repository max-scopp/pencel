import type { VNode } from "../core/vdom/types.ts";

export const getVNodeElement = (vnode: VNode): Node | null =>
  vnode.$elm$ || null;
