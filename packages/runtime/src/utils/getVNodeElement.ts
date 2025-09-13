import type { VNode } from "../core/types.ts";

export const getVNodeElement = (vnode: VNode): Node | null =>
  vnode.$elm$ || null;
