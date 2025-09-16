import type { VNode } from "../core/vdom/types.ts";

export const isVNode = (value: unknown): value is VNode =>
  value !== null && typeof value === "object" && "$type$" in value;
