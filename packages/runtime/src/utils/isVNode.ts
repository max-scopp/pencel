import type { VNode } from "../core/vdom/types.ts";

export const isVNode = (value: any): value is VNode =>
  value && typeof value === "object" && "$type$" in value && !("type" in value);
